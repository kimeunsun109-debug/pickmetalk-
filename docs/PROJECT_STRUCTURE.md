# 프로젝트 구조

```
pickmetalk/
├── app/                          # Next.js App Router
│   ├── layout.tsx, page.tsx      # 루트·랜딩
│   ├── globals.css
│   ├── (auth)/                   # 로그인·회원가입
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/                   # 인증 후 메인
│   │   ├── characters/           # 캐릭터 선택
│   │   ├── chat/[characterId]/   # 채팅
│   │   ├── gifts/
│   │   └── settings/
│   ├── admin/                    # 관리자 (프롬프트·JSON)
│   └── api/
│       ├── chat/                 # DeepSeek 스트리밍
│       ├── auth/callback/
│       ├── gifts/send/
│       ├── relationship/
│       └── absence-event/
├── components/
│   ├── chat/                     # 말풍선, 타이핑, 입력
│   ├── character/
│   ├── events/                   # 미접속 환영
│   ├── common/
│   └── layout/
├── hooks/                        # useChat, useCharacterState, useAbsenceEvent
├── lib/                          # supabase, utils, constants
├── types/                        # 도메인 + API 타입
├── data/                         # characters.json 등 (관리자 친화)
├── prompts/                      # base + 캐릭터별 + 감정
├── services/                     # ai, memory, affection, emotion, subscription
├── animations/                   # framer-motion variants
├── supabase/schema.sql
├── public/avatars/
├── middleware.ts
├── .env.example
└── README.md
```

## 데이터 흐름 (채팅)

1. 사용자 메시지 → `POST /api/chat`
2. DB에서 `user_character_states` + 최근 메시지 + `memory_summary` 로드
3. `prompts/index.ts` → 시스템 프롬프트 조합
4. `services/ai/deepseek.ts` 스트리밍
5. 응답 저장 + 호감도/감정 갱신 (규칙 또는 파싱)

## 확장 포인트

| 영역 | 파일 |
|------|------|
| 캐릭터 추가 | `data/characters.json` + `prompts/characters/*.ts` |
| AI 교체 | `services/ai/provider.ts` |
| 과금 | `data/subscription-plans.json` + `services/subscription.ts` |
| 이벤트 | `components/events/` + `app/api/absence-event` |
