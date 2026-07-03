#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { buildMomentContextBlock, detectChatMoment } from "../services/chatMomentContext";
import { toJournalJsonlLine, type VoiceJournalRow } from "../lib/db/chatVoiceJournal";

const recent = [
  { id: "1", role: "user" as const, content: "안녕~", createdAt: "" },
  { id: "2", role: "assistant" as const, content: "오늘 많이 춥지 않아?", createdAt: "" },
];

const msg = "오늘 29도 폭염이야ㅡㅡ";
assert.equal(detectChatMoment(msg, recent), "correction");

const block = buildMomentContextBlock(msg, recent);
assert.ok(block.includes("말실수"));

const row: VoiceJournalRow = {
  id: "test-id",
  user_id: "u1",
  conversation_id: "c1",
  character_id: "yuna",
  user_message: msg,
  assistant_reply: "에휴 나 머리 비었나봐 ㅋㅋ",
  time_slot: "lunch",
  follow_up: "joke",
  created_at: "2026-07-03T12:00:00.000Z",
};

const line = JSON.parse(toJournalJsonlLine(row));
assert.equal(line.source, "app");
assert.equal(line.characterId, "yuna");

console.log("✅ moment + journal format 단위 테스트 통과");
