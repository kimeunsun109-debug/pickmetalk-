export default function ChatLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#b2c7d9]/30">
      <div className="border-b border-gray-100 bg-white/95 px-4 py-3">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-accent/30 border-t-pink-accent" />
          <p className="text-sm text-gray-500">채팅 준비 중…</p>
        </div>
      </div>
    </div>
  );
}
