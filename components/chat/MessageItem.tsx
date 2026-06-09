"use client";

import { useChat } from "@/contexts/ChatProvider";
import type { ChatMessage } from "@/contexts/ChatProvider";

// ─────────────────────────────────────────────
// Hidden-text parser (나린 전용 프리미엄 훅)
// ─────────────────────────────────────────────

/**
 * 나린의 프리미엄 대사 형식:
 *   "겉으로 하는 말. (속마음이 담긴 숨겨진 텍스트.)"
 *
 * 괄호 `()` 안의 텍스트를 hidden 파트로 추출한다.
 * 메시지가 아직 스트리밍 중이면 불완전한 괄호가 있을 수 있으므로
 * isStreaming 플래그일 때는 파싱하지 않는다.
 */
function parseNarinContent(
  content: string,
  isStreaming: boolean
): { visible: string; hidden: string | null } {
  if (isStreaming) return { visible: content, hidden: null };

  // 문자열 끝에 오는 (…) 패턴 추출
  const match = content.match(/^([\s\S]+?)\s*(\([^()]+\))\s*$/);
  if (!match) return { visible: content, hidden: null };

  return {
    visible: match[1].trim(),
    hidden: match[2], // "(속마음)" 포함
  };
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/**
 * HiddenTextBlock — 비프리미엄 유저에게는 blur 처리 + 잠금 버튼을 표시한다.
 * 프리미엄 유저에게는 진한 분홍 텍스트로 그대로 보여준다.
 */
function HiddenTextBlock({
  text,
  isPremiumUser,
  onClickLock,
}: {
  text: string;
  isPremiumUser: boolean;
  onClickLock: () => void;
}) {
  if (isPremiumUser) {
    return (
      <span className="mt-1 block text-[12px] font-medium italic text-pink-accent">
        {text}
      </span>
    );
  }

  return (
    <button
      onClick={onClickLock}
      className="group relative mt-1 block w-full cursor-pointer rounded-lg text-left"
      aria-label="프리미엄 콘텐츠 잠금 — 탭하여 해제"
      title="프리미엄 구독 시 확인 가능"
    >
      {/* 실제 텍스트 (blur 처리) */}
      <span
        className="block select-none text-[12px] text-gray-700 blur-[4px] transition-all duration-200 group-hover:blur-[5px]"
        aria-hidden
      >
        {text}
      </span>

      {/* 잠금 오버레이 */}
      <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-pink-soft/60 text-[11px] font-semibold text-pink-accent backdrop-blur-[1px] transition-colors group-hover:bg-pink-soft/80">
        <span aria-hidden>🔒</span>
        <span>속마음 보기</span>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// MessageItem
// ─────────────────────────────────────────────

interface MessageItemProps {
  message: ChatMessage;
  /** 현재 AI 스트리밍 중인 마지막 메시지인지 여부 */
  isStreaming?: boolean;
}

/**
 * MessageItem — 카카오톡 스타일 말풍선.
 *
 * - user: 우측 정렬 / 분홍 배경
 * - assistant: 좌측 정렬 / 흰색 배경 + 그림자
 * - 나린(characterId === "narin") 어시스턴트 메시지에는
 *   괄호 안 hidden text가 있을 경우 프리미엄 blur 처리를 적용한다.
 */
export function MessageItem({ message, isStreaming = false }: MessageItemProps) {
  const { characterId, isPremiumUser, openPremiumModal } = useChat();
  const { role, content } = message;
  const isUser = role === "user";

  // 나린 프리미엄 훅: 어시스턴트 메시지에만 적용
  const isNarin = characterId === "narin";
  const { visible, hidden } =
    isNarin && !isUser
      ? parseNarinContent(content, isStreaming)
      : { visible: content, hidden: null };

  return (
    <div
      className={`flex w-full px-3 py-1 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* 어시스턴트 아바타 자리 (캐릭터 대표 색상 원) */}
      {!isUser && (
        <div className="mr-2 mt-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-[11px] font-bold text-white shadow-sm">
          {/* 첫 글자 이니셜 — ChatHeader 아바타와 시각적으로 연결 */}
          <AvatarInitial />
        </div>
      )}

      {/* 말풍선 */}
      <div
        className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-bubble-user text-gray-900"
              : "rounded-tl-sm bg-bubble-ai text-gray-800 shadow-sm ring-1 ring-gray-100"
          }`}
        >
          {/* 본문 */}
          <p className="whitespace-pre-wrap break-words">{visible}</p>

          {/* 나린 hidden text (프리미엄 잠금) */}
          {hidden && (
            <HiddenTextBlock
              text={hidden}
              isPremiumUser={isPremiumUser}
              onClickLock={openPremiumModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AvatarInitial — context에서 캐릭터 이름 첫 글자 읽기
// ─────────────────────────────────────────────
function AvatarInitial() {
  const { character } = useChat();
  return <>{character.name[0]}</>;
}
