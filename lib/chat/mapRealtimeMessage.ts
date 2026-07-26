import { mapMessage } from "@/lib/db/mappers";

export interface RealtimeChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  mediaType?: "photo" | null;
  mediaUrl?: string | null;
  photoDeliveryId?: string | null;
}

/** Realtime INSERT payload (snake_case) → chat UI message */
export function mapRealtimeRowToChatMessage(
  row: Record<string, unknown>
): RealtimeChatMessage | null {
  const role = row.role as string | undefined;
  if (role !== "user" && role !== "assistant") return null;

  const mapped = mapMessage(row);
  return {
    id: mapped.id,
    role: mapped.role as "user" | "assistant",
    content: mapped.content,
    createdAt: mapped.createdAt,
    mediaType: mapped.mediaType ?? null,
    mediaUrl: mapped.mediaUrl ?? null,
    photoDeliveryId: mapped.photoDeliveryId ?? null,
  };
}
