"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AlbumItem {
  id: string;
  character_id: string;
  media_url: string;
  caption: string | null;
  category: string;
  album_label: string;
  sent_at: string;
}

interface Group {
  label: string;
  count: number;
  photos: AlbumItem[];
}

const CHAR_NAMES: Record<string, string> = {
  yuna: "유나",
  narin: "나린",
  yoonseo: "윤서",
  eunha: "은하",
  jiyu: "지유",
};

export function AlbumClient({ characterId }: { characterId?: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<AlbumItem | null>(null);

  useEffect(() => {
    const qs = characterId
      ? `?characterId=${encodeURIComponent(characterId)}`
      : "";
    setLoading(true);
    void fetch(`/api/album${qs}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "load failed");
        return r.json() as Promise<{ groups: Group[] }>;
      })
      .then((j) => setGroups(j.groups ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [characterId]);

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">불러오는 중…</p>;
  }

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-sm text-red-500">
        앨범을 불러오지 못했어요. ({error})
      </p>
    );
  }

  if (!groups.length) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-gray-500">아직 받은 사진이 없어요.</p>
        <p className="mt-2 text-xs text-gray-400">
          캐릭터가 사진을 보내면 여기에 쌓여요.
        </p>
        <Link
          href="/characters"
          className="mt-6 inline-block text-sm text-pink-600 underline"
        >
          캐릭터 만나러 가기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 px-4 pb-24 pt-2">
        {groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              {g.label}{" "}
              <span className="font-normal text-gray-400">({g.count})</span>
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {g.photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setViewer(p)}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={p.media_url}
                    alt={p.caption ?? "사진"}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="33vw"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {viewer ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/92">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm opacity-80">
              {CHAR_NAMES[viewer.character_id] ?? viewer.character_id}
            </span>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm hover:bg-white/10"
              onClick={() => setViewer(null)}
            >
              닫기
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewer.media_url}
              alt={viewer.caption ?? ""}
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
          {viewer.caption ? (
            <p className="px-5 pb-8 text-center text-sm text-white/90">
              {viewer.caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
