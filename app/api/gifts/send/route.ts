/** POST — 선물 전송, 호감도·감정 업데이트 */
import { getCharacterById } from "@/lib/characters/full";
import { getConversationForCharacter } from "@/lib/db/conversations";
import { sendGiftToCharacter } from "@/lib/db/gifts";
import { createClient } from "@/lib/supabase/server";
import {
  applyGiftAffection,
  buildGiftReaction,
  getGiftById,
} from "@/services/gifts";
import type { GiftSendBody } from "@/types/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: GiftSendBody;
  try {
    body = (await request.json()) as GiftSendBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { characterId, giftId, conversationId } = body;

  if (!characterId || !giftId || !conversationId) {
    return NextResponse.json(
      { error: "characterId, giftId, conversationId 필요" },
      { status: 400 }
    );
  }

  if (!getCharacterById(characterId)) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  const gift = getGiftById(giftId);
  if (!gift) {
    return NextResponse.json({ error: "선물을 찾을 수 없습니다." }, { status: 404 });
  }

  const conversation = await getConversationForCharacter(
    supabase,
    user.id,
    characterId,
    conversationId
  );

  if (!conversation) {
    return NextResponse.json({ error: "대화방을 찾을 수 없습니다." }, { status: 404 });
  }

  const reaction = buildGiftReaction(characterId, gift);
  const { affection, relationshipLevel } = applyGiftAffection(
    conversation.affection,
    gift.affectionBonus
  );

  try {
    const { messageId, createdAt } = await sendGiftToCharacter(supabase, {
      userId: user.id,
      characterId,
      conversationId,
      giftId,
      affectionDelta: gift.affectionBonus,
      reaction,
      newAffection: affection,
      newRelationshipLevel: relationshipLevel,
    });

    return NextResponse.json({
      gift: {
        id: gift.id,
        name: gift.name,
        emoji: gift.emoji,
        affectionBonus: gift.affectionBonus,
      },
      reaction,
      affection,
      relationshipLevel,
      emotion: reaction.emotion,
      messageId,
      assistantCreatedAt: createdAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "선물 전송 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
