import { isBirthdayToday } from "@/lib/userAge";
import { mapUserProfile } from "@/lib/db/mappers";
import {
  getOrCreateEngagement,
  refreshEngagementScore,
} from "./engagement";
import { deliverPhotoPush } from "./deliver";
import { processDueFollowups } from "./followup";
import {
  ensureDailyPhotoPlan,
  resolveSpecialBonus,
} from "./planner";
import { DEFAULT_PHOTO_PUSH_TIMEZONE } from "./constants";
import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_USER_DAYS = 30;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function isAnniversary100(conversationCreatedAt: string): boolean {
  const days = daysSince(conversationCreatedAt);
  return days >= 99 && days <= 101;
}

export async function runPhotoPushCron(
  supabase: SupabaseClient
): Promise<{
  plansCreated: number;
  delivered: number;
  followupsSent: number;
}> {
  let plansCreated = 0;
  let delivered = 0;

  const followupsSent = await processDueFollowups(supabase);

  const sinceActive = new Date(
    Date.now() - ACTIVE_USER_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_id, character_id, created_at, updated_at")
    .gte("updated_at", sinceActive)
    .order("updated_at", { ascending: false })
    .limit(200);

  for (const conv of conversations ?? []) {
    const userId = conv.user_id as string;
    const characterId = conv.character_id as string;
    const conversationId = conv.id as string;

    const { data: pref } = await supabase
      .from("photo_push_preferences")
      .select("enabled, timezone")
      .eq("user_id", userId)
      .maybeSingle();

    if (pref && pref.enabled === false) continue;

    const timezone =
      (pref?.timezone as string) ?? DEFAULT_PHOTO_PUSH_TIMEZONE;

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profileRow) continue;
    const profile = mapUserProfile(profileRow);

    const { score, cooldownUntil } = await refreshEngagementScore(
      supabase,
      userId,
      characterId,
      timezone
    );
    await getOrCreateEngagement(supabase, userId, characterId);

    if (cooldownUntil && new Date(cooldownUntil) > new Date()) {
      continue;
    }

    const specialBonus = resolveSpecialBonus(
      isBirthdayToday(profile.birthDate, timezone),
      isAnniversary100(conv.created_at as string)
    );

    const { planned } = await ensureDailyPhotoPlan(supabase, {
      userId,
      characterId,
      conversationId,
      timezone,
      engagementScore: score,
      specialBonus,
      displayName: profile.displayName,
    });

    if (planned > 0) plansCreated += 1;
  }

  const nowIso = new Date().toISOString();
  const { data: dueSlots } = await supabase
    .from("photo_push_scheduled")
    .select("id, user_id, character_id, conversation_id, scenario_id, is_special_day")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .limit(50);

  for (const slot of dueSlots ?? []) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", slot.user_id)
      .maybeSingle();

    const result = await deliverPhotoPush(supabase, {
      userId: slot.user_id as string,
      characterId: slot.character_id as string,
      conversationId: slot.conversation_id as string,
      scheduledId: slot.id as string,
      scenarioId: slot.scenario_id as string,
      displayName: (profileRow?.display_name as string | null) ?? null,
      isSpecialDay: slot.is_special_day as boolean,
    });

    if (result) delivered += 1;
  }

  return { plansCreated, delivered, followupsSent };
}
