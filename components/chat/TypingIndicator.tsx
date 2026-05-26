/** 읽는중 / 타이핑중 점 애니메이션 */
export function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400 animate-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
