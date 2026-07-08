import type { PhotoFollowupTemplate } from "@/lib/photoPush/scenarios";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function scheduleFollowupsForDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  templates: PhotoFollowupTemplate[],
  sentAtIso: string
): Promise<void> {
  const sentAt = new Date(sentAtIso).getTime();
  let stage = 1;
  for (const tpl of templates) {
    const offsetMs =
      (tpl.afterMinutes ?? 0) * 60 * 1000 +
      (tpl.afterHours ?? 0) * 60 * 60 * 1000;
    if (offsetMs <= 0) continue;
    const dueAt = new Date(sentAt + offsetMs).toISOString();
    await supabase.from("photo_push_followups").insert({
      delivery_id: deliveryId,
      stage,
      due_at: dueAt,
      message: tpl.message,
      status: "pending",
    });
    stage += 1;
  }
}

export async function processDueFollowups(
  supabase: SupabaseClient,
  now = new Date()
): Promise<number> {
  const { data: due } = await supabase
    .from("photo_push_followups")
    .select("id, delivery_id, message, stage")
    .eq("status", "pending")
    .lte("due_at", now.toISOString())
    .limit(40);

  let sent = 0;
  for (const row of due ?? []) {
    const { data: delivery } = await supabase
      .from("photo_push_deliveries")
      .select("user_id, character_id, conversation_id, replied_at")
      .eq("id", row.delivery_id)
      .maybeSingle();

    if (!delivery || delivery.replied_at) {
      await supabase
        .from("photo_push_followups")
        .update({ status: "canceled" })
        .eq("id", row.id);
      continue;
    }

    const ts = now.toISOString();
    const { data: msg } = await supabase
      .from("messages")
      .insert({
        user_id: delivery.user_id,
        character_id: delivery.character_id,
        conversation_id: delivery.conversation_id,
        role: "assistant",
        content: row.message as string,
        emotion: "happy",
      })
      .select("id")
      .single();

    if (!msg) continue;

    await supabase
      .from("photo_push_followups")
      .update({
        status: "sent",
        sent_at: ts,
        sent_message_id: msg.id,
      })
      .eq("id", row.id);

    await updateConversationLastMessage(
      supabase,
      delivery.conversation_id as string,
      delivery.user_id as string,
      row.message as string,
      "assistant",
      ts
    ).catch(() => undefined);

    sent += 1;
  }
  return sent;
}

/** Mark delivery replied when user sends chat after photo */
export async function markPhotoDeliveryReplied(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  const { data: lastPhoto } = await supabase
    .from("photo_push_deliveries")
    .select("id, sent_at, replied_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .is("replied_at", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastPhoto) return;

  const now = new Date();
  const latency = Math.round(
    (now.getTime() - new Date(lastPhoto.sent_at as string).getTime()) / 1000
  );

  await supabase
    .from("photo_push_deliveries")
    .update({
      replied_at: now.toISOString(),
      reply_latency_sec: latency,
      conversation_started: true,
    })
    .eq("id", lastPhoto.id);

  await supabase
    .from("photo_push_followups")
    .update({ status: "canceled" })
    .eq("delivery_id", lastPhoto.id)
    .eq("status", "pending");
}
