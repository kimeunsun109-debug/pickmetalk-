/** 채팅 입력창 — 전송 시 /api/chat 호출 예정 */
export function ChatInput({ disabled }: { disabled?: boolean }) {
  return (
    <footer className="border-t bg-white p-3">
      <input
        type="text"
        placeholder="메시지를 입력하세요"
        disabled={disabled}
        className="w-full rounded-full border px-4 py-2 text-sm"
      />
    </footer>
  );
}
