import { messageVariation } from "@/lib/conversation/messageVariation";
import { personalizeCaption } from "@/lib/photoPush/personalize";
import { getPhotoScenario } from "@/lib/photoPush/scenarios";
import {
  defaultAssetUrl,
  pickCaption,
  type SelectedPhotoPush,
} from "@/lib/photoPush/selector";
import { selectCatalogPhoto } from "@/lib/photoCatalog/selectPhoto";
import {
  albumLabelForCategory,
  scenarioToCategory,
} from "@/lib/photoCatalog/categories";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import { sendWebPush, isWebPushConfigured } from "@/lib/push/webPush";
import { PHOTO_PUSH_DEDUP_LOOKBACK } from "./constants";
import { scheduleFollowupsForDelivery } from "./followup";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function selectPhotoPushContent(
  supabase: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    scenarioId: string;
    displayName: string | null;
    relationshipLevel?: number;
  }
): Promise<SelectedPhotoPush | null> {
  const scenario = getPhotoScenario(params.scenarioId);
  if (!scenario) return null;

  const since = new Date(
    Date.now() - PHOTO_PUSH_DEDUP_LOOKBACK * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recent } = await supabase
    .from("photo_push_deliveries")
    .select("caption, scenario_id, asset_id")
    .eq("user_id", params.userId)
    .eq("character_id", params.characterId)
    .gte("sent_at", since);

  const usedCaptions = new Set(
    (recent ?? []).map((r) => (r.caption as string) ?? "")
  );

  // Fingerprints from recent asset ids (best-effort dedupe)
  const recentAssetIds = (recent ?? [])
    .map((r) => r.asset_id as string | null)
    .filter(Boolean) as string[];
  const excludeFingerprints = new Set<string>();
  if (recentAssetIds.length) {
    const { data: recentAssets } = await supabase
      .from("character_photo_assets")
      .select("hash_fingerprint")
      .in("id", recentAssetIds);
    for (const a of recentAssets ?? []) {
      if (a.hash_fingerprint) excludeFingerprints.add(a.hash_fingerprint as string);
    }
  }

  let caption = pickCaption(
    scenario,
    usedCaptions,
    params.displayName,
    personalizeCaption
  );
  caption = messageVariation.finalize(
    caption,
    params.displayName,
    Boolean(params.displayName),
    params.characterId
  );

  const catalog = await selectCatalogPhoto(supabase, {
    characterId: params.characterId,
    scenarioId: params.scenarioId,
    emotion: scenario.emotion,
    excludeFingerprints,
    minLevel: params.relationshipLevel ?? 1,
  });

  const assetUrl = catalog?.mediaUrl ?? defaultAssetUrl(params.characterId, scenario.emotion);

  return {
    scenario,
    assetUrl,
    assetId: catalog?.assetId ?? null,
    caption,
    category: catalog?.category ?? scenarioToCategory(params.scenarioId),
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
    relationshipLevel?: number;
  }
): Promise<{ deliveryId: string; messageId: string } | null> {
  const content = await selectPhotoPushContent(supabase, {
    userId: params.userId,
    characterId: params.characterId,
    scenarioId: params.scenarioId,
    displayName: params.displayName,
    relationshipLevel: params.relationshipLevel,
  });
  if (!content) return null;

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
      metadata: {
        isSpecialDay: params.isSpecialDay ?? false,
        category: content.category ?? null,
      },
    })
    .select("id")
    .single();

  if (dErr || !delivery) return null;

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

  if (mErr || !msg) return null;

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
    .from("photo_push_scheduled")
    .update({ status: "delivered" })
    .eq("id", params.scheduledId);

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

  // Album entry (additive — ignore if migration not applied yet)
  const category = content.category ?? scenarioToCategory(params.scenarioId);
  const { error: albumErr } = await supabase.from("memory_album_items").insert({
    user_id: params.userId,
    character_id: params.characterId,
    delivery_id: delivery.id,
    media_url: content.assetUrl,
    caption: content.caption,
    category,
    album_label: albumLabelForCategory(category),
    sent_at: now,
  });
  if (albumErr) {
    // Table may not exist until migration 011 is applied
    console.warn("[photo-push] album insert skipped:", albumErr.message);
  }

  await supabase.from("session_logs").insert({
    user_id: params.userId,
    character_id: params.characterId,
    event_type: "photo_push_sent",
    metadata: {
      deliveryId: delivery.id,
      scenarioId: content.scenario.id,
      fromCatalog: Boolean(content.assetId),
    },
  });

  // Optional OS notification (Web Push)
  if (isWebPushConfigured()) {
    await notifyWebPushSubscribers(supabase, {
      userId: params.userId,
      characterId: params.characterId,
      conversationId: params.conversationId,
      deliveryId: delivery.id as string,
      caption: content.caption,
      imageUrl: content.assetUrl,
    }).catch(() => undefined);
  }

  return {
    deliveryId: delivery.id as string,
    messageId: msg.id as string,
  };
}

async function notifyWebPushSubscribers(
  supabase: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    conversationId: string;
    deliveryId: string;
    caption: string;
    imageUrl: string;
  }
) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", params.userId)
    .eq("platform", "web");

  if (!subs?.length) return;

  const deepLink = `/chat/${params.characterId}?conversationId=${params.conversationId}&photoPush=${params.deliveryId}`;

  for (const sub of subs) {
    const keys = (sub.keys ?? {}) as { p256dh?: string; auth?: string };
    if (!keys.p256dh || !keys.auth) continue;

    const result = await sendWebPush(
      {
        endpoint: sub.endpoint as string,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      {
        title: "",
        body: params.caption,
        imageUrl: params.imageUrl,
        data: {
          url: deepLink,
          deliveryId: params.deliveryId,
          characterId: params.characterId,
        },
      }
    );

    if (result.expired) {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    } else if (result.success) {
      await supabase
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }
}
