#!/usr/bin/env npx tsx
/**
 * 말투 A/B 주간 로그 분석 — journal.jsonl + daily-notes 읽기
 *
 * 사용: npx tsx scripts/analyze_voice_ab_logs.mts
 * 출력: experiments/voice-ab/reports/latest.md
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { VOICE_AB_LABELS, type VoiceAbVariant } from "../prompts/voiceAbVariants";

const ROOT = resolve(import.meta.dirname, "..");
const EXP = resolve(ROOT, "experiments/voice-ab");
const JOURNAL = resolve(EXP, "journal.jsonl");
const JOURNAL_APP = resolve(EXP, "journal-app.jsonl");
const NOTES_DIR = resolve(EXP, "daily-notes");
const REPORT_DIR = resolve(EXP, "reports");

interface JournalEntry {
  ts: string;
  date: string;
  characterId: string;
  variant?: VoiceAbVariant | null;
  source?: string;
  slot: string;
  variantLabel?: string;
  userMessage: string;
  reply: string;
}

const HUMAN_MARKERS = /ㅋ|ㅎ|헐|대박|응응|어머|진짜|ㅠ|…|\.\.\./;
const WIT_MARKERS = /ㅋㅋ|속았|치매|숙취|머리\s?비|재부팅|미안.*ㅋ|착각.*ㅋ|어이|미쳤|헐/;
const DATA_MARKERS = /데이터|통계|평균|지수|샘플|확률|분당|%/i;
const FLAT_APOLOGY = /^아\.?\.?\s*맞다|착각했네|미안해\.?$/;
const EMPATHY_MARKERS = /힘들|버텼|속상|그랬구나|괜찮|곁에|이해|걱정|수고/;

function loadJournal(): JournalEntry[] {
  const paths = [JOURNAL, JOURNAL_APP].filter((p) => existsSync(p));
  if (!paths.length) return [];
  const entries: JournalEntry[] = [];
  for (const path of paths) {
    for (const line of readFileSync(path, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line) as JournalEntry);
      } catch {
        /* skip bad line */
      }
    }
  }
  return entries;
}

function loadDailyNotes(): Record<string, string> {
  const notes: Record<string, string> = {};
  if (!existsSync(NOTES_DIR)) return notes;
  for (const f of readdirSync(NOTES_DIR)) {
    if (!f.endsWith(".md")) continue;
    notes[f.replace(".md", "")] = readFileSync(resolve(NOTES_DIR, f), "utf-8");
  }
  return notes;
}

function scoreReply(reply: string): {
  human: number;
  empathy: number;
  wit: number;
  dataHeavy: number;
  flatApology: boolean;
  length: number;
} {
  return {
    human: (reply.match(new RegExp(HUMAN_MARKERS.source, "g")) ?? []).length,
    empathy: (reply.match(EMPATHY_MARKERS) ?? []).length,
    wit: (reply.match(WIT_MARKERS) ?? []).length,
    dataHeavy: (reply.match(DATA_MARKERS) ?? []).length,
    flatApology: FLAT_APOLOGY.test(reply.trim()),
    length: reply.length,
  };
}

function main() {
  const entries = loadJournal();
  const notes = loadDailyNotes();

  if (!entries.length) {
    console.log("journal.jsonl 비어 있음. 먼저 character_voice_ab_run.mts 실행.");
    process.exit(0);
  }

  const byVariant: Record<
    VoiceAbVariant,
    { count: number; human: number; empathy: number; wit: number; dataHeavy: number; flatApology: number; samples: string[] }
  > = {
    A: { count: 0, human: 0, empathy: 0, wit: 0, dataHeavy: 0, flatApology: 0, samples: [] },
    B: { count: 0, human: 0, empathy: 0, wit: 0, dataHeavy: 0, flatApology: 0, samples: [] },
    C: { count: 0, human: 0, empathy: 0, wit: 0, dataHeavy: 0, flatApology: 0, samples: [] },
  };

  const appEntries = { count: 0, wit: 0, flatApology: 0 };

  const byCharacter: Record<string, number> = {};

  for (const e of entries) {
    const s = scoreReply(e.reply);
    const variant = e.variant as VoiceAbVariant | null;
    if (variant && byVariant[variant]) {
      const v = byVariant[variant];
      v.count += 1;
      v.human += s.human;
      v.empathy += s.empathy;
      v.wit += s.wit;
      v.dataHeavy += s.dataHeavy;
      v.flatApology += s.flatApology ? 1 : 0;
      if (v.samples.length < 3) v.samples.push(e.reply.slice(0, 120));
    } else {
      appEntries.count += 1;
      appEntries.wit += s.wit;
      appEntries.flatApology += s.flatApology ? 1 : 0;
    }
    byCharacter[e.characterId] = (byCharacter[e.characterId] ?? 0) + 1;
  }

  const lines: string[] = [
    "# 말투 A/B 주간 분석",
    "",
    `생성: ${new Date().toISOString()}`,
    `총 대화: ${entries.length}건`,
    "",
    "## 변형별 요약",
    "",
    "| 변형 | 건수 | 인간 리액션 | 공감 | 센스(ㅋㅋ·드립) | 데이터 톤 | 뻣뻣한 사과 |",
    "|------|------|------------|------|----------------|----------|------------|",
  ];

  for (const variant of ["A", "B", "C"] as VoiceAbVariant[]) {
    const v = byVariant[variant];
    const label = VOICE_AB_LABELS[variant].label;
    lines.push(
      `| ${variant} ${label} | ${v.count} | ${v.human} | ${v.empathy} | ${v.wit} | ${v.dataHeavy} | ${v.flatApology} |`
    );
  }

  if (appEntries.count > 0) {
    lines.push(
      "",
      "## 앱 실사용 저널",
      "",
      `- 건수: ${appEntries.count}`,
      `- 센스 마커 합: ${appEntries.wit}`,
      `- 뻣뻣한 사과(착각했네만): ${appEntries.flatApology}건 → **낮을수록 좋음**`,
      ""
    );
  }

  lines.push("", "## 변형별 샘플 응답", "");
  for (const variant of ["A", "B", "C"] as VoiceAbVariant[]) {
    lines.push(`### ${variant} — ${VOICE_AB_LABELS[variant].label}`);
    for (const s of byVariant[variant].samples) {
      lines.push(`- ${s}${s.length >= 120 ? "…" : ""}`);
    }
    lines.push("");
  }

  if (Object.keys(notes).length) {
    lines.push("## 일별 메모 (오늘 마음에 든 말투)", "");
    for (const [date, text] of Object.entries(notes).sort()) {
      lines.push(`### ${date}`, text.trim(), "");
    }
  } else {
    lines.push(
      "## 일별 메모",
      "",
      "`experiments/voice-ab/daily-notes/YYYY-MM-DD.md` 에 아래 형식으로 기록하세요:",
      "",
      "```",
      "오늘 마음에 든 말투: B",
      "살아있게 느껴진 순간: 야근 얘기에 '그래 오늘 길었지' 라고 먼저 받아준 부분",
      "아쉬운 점: 데이터처럼 들린 문장",
      "```",
      ""
    );
  }

  lines.push("## 다음 단계 (말투 틀 초안)", "");
  lines.push(
    "1. **공통**: 공감 먼저, 카톡 1~3문장, 괄호 지문 금지",
    "2. **캐릭터별**: 자기소개서(`data/characterIdentities.ts`)에서 essence 유지",
    "3. **A/B 결과 반영**: 일별 메모에서 가장 높은 점수 변형의 리듬을 해당 캐릭터 naturalVoice에 반영",
    "4. **수정 위치**: 주로 `characterIdentities.ts` 자기소개서, `base.ts` 공감 원칙, `speechStyle.ts` 우선순위",
    ""

  );

  mkdirSync(REPORT_DIR, { recursive: true });
  const out = resolve(REPORT_DIR, "latest.md");
  writeFileSync(out, lines.join("\n"), "utf-8");
  console.log(`리포트: ${out}`);
  console.log(lines.join("\n"));
}

main();
