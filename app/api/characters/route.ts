/**
 * GET /api/characters
 *
 * Supabase characters 마스터 테이블에서 활성 캐릭터 목록을 반환한다.
 * 비인증 상태에서도 캐릭터 목록은 열람 가능하도록 anon key로 접근.
 *
 * Query params:
 *   ?all=1  → is_active 여부와 무관하게 전체 반환 (관리자용)
 *
 * Response:
 *   { characters: MappedCharacter[] }
 *
 * Fallback:
 *   DB에서 characters 테이블이 비어있거나 오류가 발생하면
 *   data/characters.json 으로 폴백하여 서비스 중단 없이 응답한다.
 */
import { mapCharacter, type CharacterRow } from "@/lib/db/mappers";
import { characters as staticCharacters } from "@/data";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "1";

  try {
    const supabase = await createClient();

    let query = supabase
      .from("characters")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!showAll) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    // DB 오류이거나 시드 데이터가 아직 없으면 JSON 폴백
    if (error || !data || data.length === 0) {
      const fallback = staticCharacters.map((c) => ({
        id: c.id,
        name: c.name,
        tagline: c.tagline,
        avatarUrl: c.avatar,
        defaultEmotion: c.defaultEmotion,
        defaultExpression: c.defaultExpression,
        isActive: true,
        isPremiumOnly: false,
        sortOrder: 0,
        _source: "json_fallback" as const,
      }));
      return NextResponse.json({ characters: fallback });
    }

    const characters = (data as CharacterRow[]).map(mapCharacter);
    return NextResponse.json({ characters });
  } catch {
    // 예외 발생 시에도 JSON 폴백으로 서비스 유지
    const fallback = staticCharacters.map((c) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      avatarUrl: c.avatar,
      defaultEmotion: c.defaultEmotion,
      defaultExpression: c.defaultExpression,
      isActive: true,
      isPremiumOnly: false,
      sortOrder: 0,
      _source: "json_fallback" as const,
    }));
    return NextResponse.json({ characters: fallback });
  }
}
