import { AlbumClient } from "@/components/album/AlbumClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "앨범 | PickMeTalk",
};

export default async function AlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <header className="sticky top-0 z-10 border-b border-rose-100/80 bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold text-gray-900">추억 앨범</h1>
        <p className="text-xs text-gray-500">캐릭터가 보낸 사진들</p>
      </header>
      <AlbumClient characterId={sp.characterId} />
    </main>
  );
}
