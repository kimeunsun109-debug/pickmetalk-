import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { isReactionLine, SCORE_LABELS, starsFromScore } from "./constants";
import type {
  AnalyzedSentence,
  ConversationTurn,
  DaySlot,
  SentenceTag,
} from "./types";

function splitSentences(text: string): string[] {
  const raw = text
    .split(/\n+/)
    .flatMap((line) =>
      line.match(/[^.!?~…]+[.!?~…]+|[^.!?~…]+$/gu) ?? [line]
    );
  return raw.map((s) => s.trim()).filter((s) => s.length >= 1);
}

const ANALYZER_SYSTEM = `너는 연인 AI 채팅 데이터셋 분석가다.
대화 원문을 그대로 저장하지 말고, 문장 단위로 분석해 JSON만 출력한다.

태그(복수 가능): 상황, 감정, 공감, 센스, 드립, 생활밀착, 관심, 질문, 마무리, 행동유도, 명대사
리액션만 있는 짧은 문장(와., 헐, ㅋㅋㅋ, 아 진짜?, 대박인데?)은 primaryTag를 "리액션"으로.

점수 1~5:
5=반드시 재사용할 수준(킥문장·깊은 공감)
4=매우 좋음
3=평균 이상
2=참고용
1=제외

JSON 배열만 출력:
[{
  "text": "문장",
  "primaryTag": "공감",
  "tags": ["공감","생활밀착"],
  "situation": "퇴근",
  "userEmotion": "지침",
  "aiEmotion": "다정",
  "dialoguePurpose": "위로",
  "isQuestion": false,
  "hasEmpathy": true,
  "hasLifeClose": true,
  "isKickLine": false,
  "score": 4
}]`;

export async function analyzeTurnSentences(options: {
  client: OpenAI;
  date: string;
  slot: DaySlot;
  sessionId: string;
  turn: ConversationTurn;
  scenarioTitle: string;
}): Promise<AnalyzedSentence[]> {
  const { client, date, slot, sessionId, turn, scenarioTitle } = options;
  const results: AnalyzedSentence[] = [];

  const pairs: Array<{ role: "user" | "assistant"; text: string }> = [
    { role: "user", text: turn.user },
    { role: "assistant", text: turn.assistant },
  ];

  for (const { role, text } of pairs) {
    const sentences = splitSentences(text);
    if (!sentences.length) sentences.push(text.trim());

    const preTagged = sentences.filter((s) => isReactionLine(s));
    const toAnalyze = sentences.filter((s) => !isReactionLine(s));

    for (const s of preTagged) {
      results.push({
        id: randomUUID(),
        date,
        slot,
        sessionId,
        turn: turn.turn,
        characterId: turn.characterId,
        role,
        text: s,
        primaryTag: "리액션",
        tags: ["리액션", "센스"],
        situation: scenarioTitle,
        userEmotion: "",
        aiEmotion: "",
        dialoguePurpose: "티키타카",
        isQuestion: false,
        hasEmpathy: false,
        hasLifeClose: false,
        isKickLine: false,
        isReaction: true,
        score: 4,
        scoreLabel: SCORE_LABELS[4],
      });
    }

    if (!toAnalyze.length) continue;

    const res = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: ANALYZER_SYSTEM },
        {
          role: "user",
          content: `상황: ${scenarioTitle}\n역할: ${role}\n캐릭터: ${turn.characterId}\n분석할 문장들:\n${toAnalyze.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) continue;

    let parsed: Array<Record<string, unknown>>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
    } catch {
      continue;
    }

    for (let i = 0; i < toAnalyze.length; i++) {
      const p = parsed[i] ?? parsed[0];
      if (!p) continue;
      const score = starsFromScore(Number(p.score) || 3);
      results.push({
        id: randomUUID(),
        date,
        slot,
        sessionId,
        turn: turn.turn,
        characterId: turn.characterId,
        role,
        text: String(p.text ?? toAnalyze[i]),
        primaryTag: (String(p.primaryTag ?? "공감") as SentenceTag) || "공감",
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [String(p.primaryTag)],
        situation: String(p.situation ?? scenarioTitle),
        userEmotion: String(p.userEmotion ?? ""),
        aiEmotion: String(p.aiEmotion ?? ""),
        dialoguePurpose: String(p.dialoguePurpose ?? ""),
        isQuestion: Boolean(p.isQuestion),
        hasEmpathy: Boolean(p.hasEmpathy),
        hasLifeClose: Boolean(p.hasLifeClose),
        isKickLine: Boolean(p.isKickLine),
        isReaction: false,
        score,
        scoreLabel: SCORE_LABELS[score],
      });
    }
  }

  return results;
}
