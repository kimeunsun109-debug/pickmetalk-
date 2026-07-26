"use client";

import {
  mapRealtimeRowToChatMessage,
  type RealtimeChatMessage,
} from "@/lib/chat/mapRealtimeMessage";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

interface Options {
  conversationId: string | null;
  onInsert: (message: RealtimeChatMessage) => void;
  /** Skip while local stream is in progress */
  isPaused?: boolean;
}

/** Subscribe to new messages for cross-device sync (Supabase Realtime). */
export function useConversationRealtime({
  conversationId,
  onInsert,
  isPaused = false,
}: Options) {
  useEffect(() => {
    if (!conversationId || isPaused) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg = mapRealtimeRowToChatMessage(row);
          if (msg) onInsert(msg);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, isPaused, onInsert]);
}
