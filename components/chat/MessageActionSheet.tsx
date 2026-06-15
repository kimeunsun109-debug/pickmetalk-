"use client";

interface MessageActionSheetProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

/** Long-press delete menu — KakaoTalk-style bottom sheet. */
export function MessageActionSheet({
  open,
  onClose,
  onDelete,
}: MessageActionSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal
        aria-label="메시지 메뉴"
        className="relative z-10 w-full max-w-md animate-[slideUp_0.2s_ease-out] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 border-b border-gray-100 py-4 text-[15px] font-medium text-red-500 active:bg-red-50"
          >
            <span aria-hidden>🗑</span>
            삭제
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center py-4 text-[15px] text-gray-700 active:bg-gray-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
