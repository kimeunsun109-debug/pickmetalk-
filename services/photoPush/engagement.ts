import type { SupabaseClient } from "@supabase/supabase-js";
import { getHourInTz } from "@/lib/photoPush/timezone";
import {
  DEFAULT_PHOTO_PUSH_TIMEZONE,
  PHOTO_PUSH_LOW_ENGAGEMENT_COOLDOWN_DAYS,
} from "./constants";

export interface EngagementSnapshot {
  score: number;
  sendsLast7d: number;
  clicksLast7d: number;
  repliesLast7d: number;
}

export async function getOrCreateEngagement(
  supabase: SupabaseClient,
  userId: string,
  characterId: string
): Promise<EngagementSnapshot> {
  const { data } = await supabase
    .from("photo_push_engagement")
    .select("*")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .maybeSingle();

  if (data) {
    return {
      score: Number(data.engagement_score) || 50,
      sendsLast7d: (data.sends_last_7d as number) ?? 0,
      clicksLast7d: (data.clicks_last_7d as number) ?? 0,
      repliesLast7d: (data.replies_last_7d as number) ?? 0,
    };
  }

  await supabase.from("photo_push_engagement").insert({
    user_id: userId,
    character_id: characterId,
    engagement_score: 50,
  });

  return { score: 50, sendsLast7d: 0, clicksLast7d: 0, repliesLast7d: 0 };
}

/** Recompute score from recent delivery outcomes */
export async function refreshEngagementScore(
  supabase: SupabaseClient,
  userId: string,
  characterId: string,
  timeZone = DEFAULT_PHOTO_PUSH_TIMEZONE
): Promise<{ score: number; cooldownUntil: string | null }> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: deliveries } = await supabase
    .from("photo_push_deliveries")
    .select(
      "push_clicked_at, photo_viewed_at, replied_at, reply_latency_sec, sent_at"
    )
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .gte("sent_at", since);

  const rows = deliveries ?? [];
  const sends = rows.length;
  const clicks = rows.filter((r) => r.push_clicked_at || r.photo_viewed_at).length;
  const replies = rows.filter((r) => r.replied_at).length;

  let score = 50;
  if (sends > 0) {
    const ctr = clicks / sends;
    const replyRate = replies / sends;
    score = Math.round(30 + ctr * 35 + replyRate * 35);
  }
  score = Math.max(0, Math.min(100, score));

  const clickHours = rows
    .filter((r) => r.push_clicked_at || r.photo_viewed_at)
    .map((r) =>
      getHourInTz(
        new Date((r.push_clicked_at ?? r.photo_viewed_at) as string),
        timeZone
      )
    );

  const optimalHours =
    clickHours.length >= 2
      ? [...new Set(clickHours)].slice(0, 4)
      : [];

  const cooldownUntil = shouldApplyLowEngagementCooldown(score)
    ? new Date(
        Date.now() + PHOTO_PUSH_LOW_ENGAGEMENT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      ).toISOString()
    : null;

  await supabase
    .from("photo_push_engagement")
    .upsert(
      {
        user_id: userId,
        character_id: characterId,
        engagement_score: score,
        sends_last_7d: sends,
        clicks_last_7d: clicks,
        replies_last_7d: replies,
        optimal_hours: optimalHours,
        cooldown_until: cooldownUntil,
        last_computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,character_id" }
    );

  return { score, cooldownUntil };
}

export function shouldApplyLowEngagementCooldown(score: number): boolean {
  return score < 30;
}
