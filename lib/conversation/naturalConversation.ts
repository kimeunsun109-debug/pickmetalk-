/**
 * NaturalConversationEngine — polish outbound chat/captions to sound human.
 * Ported from ops; no Prisma / Express dependencies.
 */

import {
  ALLOWED_EMOJIS,
  BANNED_AI_PHRASES,
  CHARACTER_SPEECH_HINTS,
  INTENT_KEYWORDS,
  INTENT_REACTIONS,
  MAX_EMOJIS_PER_MESSAGE,
  MAX_MESSAGE_LENGTH,
  MAX_SENTENCES,
  normalizeCharacterSlug,
} from "./naturalConversation.config";

export interface ConversationContext {
  userName?: string;
  characterSlug?: string;
  stageLevel?: number;
  useName?: boolean;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const SENTENCE_SPLIT = /(?<=[.!?…~])\s+|\n+/u;

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export class NaturalConversationEngine {
  containsBannedPhrase(text: string): boolean {
    const lower = text.toLowerCase();
    return BANNED_AI_PHRASES.some((p) => lower.includes(p.toLowerCase()));
  }

  stripBannedPhrases(text: string): string {
    const sentences = this.splitSentences(text);
    const filtered = sentences.filter((s) => !this.containsBannedPhrase(s));
    if (filtered.length === 0) {
      return randomPick(["헐", "진짜?", "ㅋㅋ", "그래?"]);
    }
    return filtered.join(" ");
  }

  limitSentences(text: string, max = MAX_SENTENCES): string {
    return this.splitSentences(text).slice(0, max).join(" ");
  }

  limitEmojis(text: string, max = MAX_EMOJIS_PER_MESSAGE): string {
    const matches = text.match(EMOJI_REGEX) ?? [];
    if (matches.length === 0) return text;

    let count = 0;
    return text
      .replace(EMOJI_REGEX, (emoji) => {
        const allowed = (ALLOWED_EMOJIS as readonly string[]).includes(emoji);
        if (!allowed) return "";
        if (count >= max) return "";
        count++;
        return emoji;
      })
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  reduceQuestionSpam(text: string): string {
    const sentences = this.splitSentences(text);
    if (sentences.length <= 1) return text;

    const questions = sentences.filter((s) => s.trim().endsWith("?"));
    if (questions.length <= 1) return text;

    const nonQuestions = sentences.filter((s) => !s.trim().endsWith("?"));
    const lastQuestion = questions[questions.length - 1]!;
    return [...nonQuestions, lastQuestion].join(" ");
  }

  polishOutbound(message: string, ctx: ConversationContext = {}): string {
    if (!message?.trim()) return "ㅋㅋ";

    let result = message.trim();
    result = this.stripBannedPhrases(result);
    result = this.limitSentences(result);
    result = this.reduceQuestionSpam(result);
    result = this.limitEmojis(result);
    result = this.applyCharacterHint(
      result,
      normalizeCharacterSlug(ctx.characterSlug)
    );
    result = result.slice(0, MAX_MESSAGE_LENGTH).trim();

    if (!result) return "ㅋㅋ";
    return result;
  }

  detectIntent(userContent: string): string | null {
    const lower = userContent.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k))) return intent;
    }
    return null;
  }

  reactToUserMessage(
    userContent: string,
    ctx: ConversationContext = {}
  ): string {
    const intent = this.detectIntent(userContent);
    const pool = intent ? INTENT_REACTIONS[intent] : null;

    let reaction = pool
      ? randomPick(pool)
      : randomPick(["그래?", "헐", "진짜?", "ㅋㅋ", "오 그래?"]);

    if (
      ctx.useName &&
      ctx.userName &&
      Math.random() < 0.3 &&
      !reaction.includes(ctx.userName)
    ) {
      reaction = `${ctx.userName} ${reaction}`;
    }

    return this.polishOutbound(reaction, ctx);
  }

  private splitSentences(text: string): string[] {
    return text
      .split(SENTENCE_SPLIT)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private applyCharacterHint(message: string, slug?: string): string {
    if (!slug) return message;
    const hints = CHARACTER_SPEECH_HINTS[slug];
    if (!hints) return message;

    if (hints.prefix && Math.random() < 0.15) {
      const prefix = randomPick(hints.prefix);
      if (!message.startsWith(prefix.trim())) {
        message = `${prefix}${message}`;
      }
    }
    return message;
  }
}

export const naturalConversationEngine = new NaturalConversationEngine();

export function polishCharacterMessage(
  message: string,
  ctx: ConversationContext = {}
): string {
  return naturalConversationEngine.polishOutbound(message, ctx);
}
