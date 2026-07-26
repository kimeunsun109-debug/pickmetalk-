"use client";

interface MessageActionSheetProps {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

/** Long-press message menu (copy/delete) — KakaoTalk-style bottom sheet. */
export function MessageActionSheet({
  open,
  onClose,
  onCopy,
  onDelete,
  canDelete,
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
              onCopy();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 border-b border-gray-100 py-4 text-[15px] font-medium text-gray-800 active:bg-gray-50"
          >
            복사
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 border-b border-gray-100 py-4 text-[15px] font-medium text-red-500 active:bg-red-50"
            >
              삭제
            </button>
          )}
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
