import { personalizeCaption } from "@/lib/photoPush/personalize";
import { getPhotoScenario } from "@/lib/photoPush/scenarios";
import {
  defaultAssetUrl,
  pickCaption,
  type SelectedPhotoPush,
} from "@/lib/photoPush/selector";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import { PHOTO_PUSH_DEDUP_LOOKBACK } from "./constants";
import { scheduleFollowupsForDelivery } from "./followup";
import type { SupabaseClient } from "@supabase/supabase-js";

async function cancelScheduledSlot(
  supabase: SupabaseClient,
  scheduledId: string
): Promise<void> {
  await supabase
    .from("photo_push_scheduled")
    .update({ status: "canceled" })
    .eq("id", scheduledId);
}

export async function selectPhotoPushContent(
  supabase: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    scenarioId: string;
    displayName: string | null;
  }
): Promise<SelectedPhotoPush | null> {
  const scenario = getPhotoScenario(params.scenarioId);
  if (!scenario) return null;

  const since = new Date(
    Date.now() - PHOTO_PUSH_DEDUP_LOOKBACK * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recent } = await supabase
    .from("photo_push_deliveries")
    .select("caption, scenario_id")
    .eq("user_id", params.userId)
    .eq("character_id", params.characterId)
    .gte("sent_at", since);

  const usedCaptions = new Set(
    (recent ?? []).map((r) => (r.caption as string) ?? "")
  );

  const caption = pickCaption(
    scenario,
    usedCaptions,
    params.displayName,
    personalizeCaption
  );
  const assetUrl = defaultAssetUrl(params.characterId, scenario.emotion);

  return {
    scenario,
    assetUrl,
    assetId: null,
    caption,
  };
}

export async function deliverPhotoPush(
  supabase: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    conversationId: string;
    scheduledId: string;
    scenarioId: string;
    displayName: string | null;
    isSpecialDay?: boolean;
  }
): Promise<{ deliveryId: string; messageId: string } | null> {
  const { data: existingDelivery } = await supabase
    .from("photo_push_deliveries")
    .select("id, message_id")
    .eq("scheduled_id", params.scheduledId)
    .maybeSingle();

  if (existingDelivery?.message_id) {
    await supabase
      .from("photo_push_scheduled")
      .update({ status: "delivered" })
      .eq("id", params.scheduledId);
    return {
      deliveryId: existingDelivery.id as string,
      messageId: existingDelivery.message_id as string,
    };
  }

  const { data: claimed } = await supabase
    .from("photo_push_scheduled")
    .update({ status: "delivered" })
    .eq("id", params.scheduledId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) return null;

  const content = await selectPhotoPushContent(supabase, {
    userId: params.userId,
    characterId: params.characterId,
    scenarioId: params.scenarioId,
    displayName: params.displayName,
  });
  if (!content) {
    await cancelScheduledSlot(supabase, params.scheduledId);
    return null;
  }

  const now = new Date().toISOString();

  const { data: delivery, error: dErr } = await supabase
    .from("photo_push_deliveries")
    .insert({
      user_id: params.userId,
      character_id: params.characterId,
      conversation_id: params.conversationId,
      scheduled_id: params.scheduledId,
      scenario_id: content.scenario.id,
      asset_id: content.assetId,
      caption: content.caption,
      media_url: content.assetUrl,
      sent_at: now,
      metadata: { isSpecialDay: params.isSpecialDay ?? false },
    })
    .select("id")
    .single();

  if (dErr || !delivery) {
    await cancelScheduledSlot(supabase, params.scheduledId);
    return null;
  }

  const { data: msg, error: mErr } = await supabase
    .from("messages")
    .insert({
      user_id: params.userId,
      character_id: params.characterId,
      conversation_id: params.conversationId,
      role: "assistant",
      content: content.caption,
      emotion: content.scenario.emotion,
      media_type: "photo",
      media_url: content.assetUrl,
      photo_delivery_id: delivery.id,
    })
    .select("id")
    .single();

  if (mErr || !msg) {
    await cancelScheduledSlot(supabase, params.scheduledId);
    return null;
  }

  await supabase
    .from("photo_push_deliveries")
    .update({ message_id: msg.id })
    .eq("id", delivery.id);

  await updateConversationLastMessage(
    supabase,
    params.conversationId,
    params.userId,
    content.caption,
    "assistant",
    now,
    { emotion: content.scenario.emotion }
  ).catch(() => undefined);

  await supabase
    .from("user_character_states")
    .update({
      last_chat_at: now,
      last_seen_at: now,
      last_push_sent_at: now,
      emotion: content.scenario.emotion,
    })
    .eq("user_id", params.userId)
    .eq("character_id", params.characterId);

  await scheduleFollowupsForDelivery(
    supabase,
    delivery.id as string,
    content.scenario.followups,
    now
  );

  await supabase.from("session_logs").insert({
    user_id: params.userId,
    character_id: params.characterId,
    event_type: "photo_push_sent",
    metadata: {
      deliveryId: delivery.id,
      scenarioId: content.scenario.id,
    },
  });

  return {
    deliveryId: delivery.id as string,
    messageId: msg.id as string,
  };
}
