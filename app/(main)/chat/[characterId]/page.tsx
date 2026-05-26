/**
 * 카카오톡 스타일 채팅 — 스트리밍 + 감정/호감도 반영
 * @see app/api/chat/route.ts
 * @see components/chat/
 */
export default async function ChatPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="font-semibold">채팅 — {characterId}</h1>
      </header>
      <p className="p-4 text-sm text-gray-500">채팅 UI·스트리밍 구현 예정</p>
    </main>
  );
}
