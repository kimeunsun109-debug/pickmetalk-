# app_girl-friend

# AI 여자친구 — 한국형 감성 연애 채팅 MVP

카카오톡 느낌의 감정·관계 성장형 AI 여자친구 웹앱 (구조 단계 완료).

## 기술 스택

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **DB / Auth:** Supabase
- **AI:** DeepSeek (교체 가능 구조)
- **배포:** Vercel

## 폴더 구조

상세: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

## 로컬 실행 (다음에 할 일)

1. [Node.js LTS](https://nodejs.org/) 설치 후 터미널 재시작
2. 의존성 설치:

```bash
cd c:\Users\user\ai_girlfriend_app
npm install
```

3. `.env.example` → `.env.local` 복사 후 키 입력
4. Supabase에서 `supabase/schema.sql` 실행
5. 개발 서버:

```bash
npm run dev
```

6. http://localhost:3000

## DB

`supabase/schema.sql` — profiles, user_character_states, messages, gift_logs + RLS

## API (스켈레톤)

| 경로 | 용도 |
|------|------|
| `POST /api/chat` | 스트리밍 채팅 |
| `GET /api/absence-event` | 3일+ 미접속 이벤트 |
| `POST /api/gifts/send` | 선물 |
| `GET /api/relationship` | 호감도·레벨 |

## 캐릭터 (5명)

유나 · 나린 · 윤서 · 은하 · 지유 — `data/characters.json`

## 현재 상태

- ✅ 프로젝트 골격·타입·JSON 데이터·프롬프트·DB 스키마
- ⏳ Supabase Auth UI, DeepSeek 스트리밍, 채팅 UI 완성 (다음 세션)

## Vercel 배포

1. GitHub에 푸시
2. Vercel Import → Root Directory: `ai_girlfriend_app`
3. Environment Variables에 `.env.example` 항목 등록
4. Deploy

## 라이선스

Private MVP — 상용 전 법적·플랫폼 정책 검토 권장.
