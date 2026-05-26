/** 카톡 스타일 말풍선 — user / assistant 구분 */
export function ChatBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-3 py-1`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-bubble-user" : "bg-bubble-ai shadow-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
