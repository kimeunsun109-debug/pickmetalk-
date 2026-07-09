import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import {
  BEST_LINE_CATEGORY_MAP,
  DATASET_ROOT,
  SCORE_LABELS,
} from "./constants";
import type {
  AnalyzedSentence,
  BestLineEntry,
  DailyLog,
  ScoreStatistics,
} from "./types";

const ROOT = resolve(process.cwd(), DATASET_ROOT);

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, data: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export function dailyLogPath(date: string): string {
  return resolve(ROOT, "daily_logs", `${date}.json`);
}

export function saveDailyLog(log: DailyLog): void {
  writeJson(dailyLogPath(log.date), log);
}

export function loadDailyLog(date: string): DailyLog | null {
  return readJson<DailyLog | null>(dailyLogPath(date), null);
}

export function appendBestLines(sentences: AnalyzedSentence[]): void {
  const five = sentences.filter((s) => s.score === 5 && s.role === "assistant");
  if (!five.length) return;

  const bestPath = resolve(ROOT, "best_lines.json");
  const existing = readJson<BestLineEntry[]>(bestPath, []);
  const now = new Date().toISOString();

  for (const s of five) {
    const catKey = BEST_LINE_CATEGORY_MAP[s.primaryTag] ?? "misc";
    const entry: BestLineEntry = {
      ...s,
      category: catKey,
      savedAt: now,
    };
    existing.push(entry);
    const catPath = resolve(ROOT, "best_lines", `${catKey}.json`);
    const catArr = readJson<BestLineEntry[]>(catPath, []);
    catArr.push(entry);
    writeJson(catPath, catArr);
  }

  writeJson(bestPath, existing);
}

export function updateStatistics(log: DailyLog): void {
  const statsPath = resolve(ROOT, "statistics", "score.json");
  const stats = readJson<ScoreStatistics>(statsPath, {
    updatedAt: new Date().toISOString(),
    byDate: {},
    allTime: { totalSentences: 0, avgScore: 0, fiveStar: 0 },
  });

  const sentences = log.sessions.flatMap((s) => s.sentences);
  const scores = sentences.map((s) => s.score);
  const avg =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  const fiveStar = sentences.filter((s) => s.score === 5).length;

  const byChar: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  for (const s of sentences) {
    byChar[s.characterId] = (byChar[s.characterId] ?? 0) + 1;
    byTag[s.primaryTag] = (byTag[s.primaryTag] ?? 0) + 1;
  }

  stats.byDate[log.date] = {
    totalSentences: sentences.length,
    avgScore: Math.round(avg * 100) / 100,
    fiveStar,
    byCharacter: byChar,
    byTag: byTag,
  };
  stats.updatedAt = new Date().toISOString();

  const allScores = Object.values(stats.byDate).flatMap((d) =>
    Array(d.totalSentences).fill(d.avgScore)
  );
  stats.allTime = {
    totalSentences: sentences.length + (stats.allTime.totalSentences ?? 0),
    avgScore:
      allScores.length > 0
        ? Math.round(
            (Object.values(stats.byDate).reduce(
              (sum, d) => sum + d.avgScore * d.totalSentences,
              0
            ) /
              Object.values(stats.byDate).reduce(
                (sum, d) => sum + d.totalSentences,
                0
              )) *
              100
          ) / 100
        : 0,
    fiveStar:
      (stats.allTime.fiveStar ?? 0) +
      fiveStar,
  };

  writeJson(statsPath, stats);
}

export function updateConversationPatterns(log: DailyLog): void {
  const path = resolve(ROOT, "patterns", "conversation_patterns.json");
  const existing = readJson<
    Array<{
      scenarioId: string;
      slot: string;
      characterId: string;
      turnCount: number;
      topTags: string[];
      date: string;
    }>
  >(path, []);

  for (const session of log.sessions) {
    const tagCounts: Record<string, number> = {};
    for (const s of session.sentences) {
      tagCounts[s.primaryTag] = (tagCounts[s.primaryTag] ?? 0) + 1;
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    existing.push({
      scenarioId: session.scenarioId,
      slot: session.slot,
      characterId: session.characterId,
      turnCount: session.turns.length,
      topTags,
      date: log.date,
    });
  }

  writeJson(path, existing.slice(-200));
}

export function updateUserStylePatterns(log: DailyLog): void {
  const path = resolve(ROOT, "patterns", "user_style_patterns.json");
  const existing = readJson<
    Array<{ text: string; count: number; lastSeen: string }>
  >(path, []);

  const userLines = log.sessions
    .flatMap((s) => s.sentences)
    .filter((s) => s.role === "user");

  for (const line of userLines) {
    const found = existing.find((e) => e.text === line.text);
    if (found) {
      found.count += 1;
      found.lastSeen = log.date;
    } else {
      existing.push({ text: line.text, count: 1, lastSeen: log.date });
    }
  }

  existing.sort((a, b) => b.count - a.count);
  writeJson(path, existing.slice(0, 500));
}

export function initDatasetDirs(): void {
  for (const sub of [
    "daily_logs",
    "best_lines",
    "patterns",
    "statistics",
  ]) {
    ensureDir(resolve(ROOT, sub));
  }
  const seeds = [
    "best_lines.json",
    "best_lines/empathy.json",
    "best_lines/humor.json",
    "best_lines/kick_lines.json",
    "best_lines/life.json",
    "best_lines/romance.json",
    "best_lines/compliments.json",
    "best_lines/comfort.json",
    "best_lines/questions.json",
    "best_lines/reactions.json",
    "patterns/conversation_patterns.json",
    "patterns/user_style_patterns.json",
    "statistics/score.json",
  ];
  for (const f of seeds) {
    const p = resolve(ROOT, f);
    if (!existsSync(p)) writeJson(p, f.endsWith("score.json") ? { byDate: {}, allTime: { totalSentences: 0, avgScore: 0, fiveStar: 0 }, updatedAt: null } : []);
  }
}

export { SCORE_LABELS };
