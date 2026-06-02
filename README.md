# AI 여자친구 — 한국형 감성 연애 채팅 MVP

카카오톡 느낌의 감정·관계 성장형 AI 여자친구 웹앱.

## 기술 스택

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **DB / Auth:** Supabase
- **AI:** DeepSeek (`deepseek-chat`)
- **배포:** Vercel

## 로컬 실행

### 1. 의존성 설치

```bash
cd c:\Users\user\ai_girlfriend_app
npm install
```

### 2. 환경 변수

`.env.example`을 복사해 `.env.local`을 만든 뒤 값을 채웁니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `DEEPSEEK_API_KEY` | DeepSeek API 키 (서버 전용) |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` (기본값 사용 가능) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

> API 키는 **절대** `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Authentication → Providers에서 **Email** 활성화
4. (선택) 이메일 확인 없이 바로 로그인하려면: Authentication → Settings에서 **Confirm email** 비활성화

### 4. 개발 서버

```bash
npm run dev
```

브라우저에서 http://localhost:3000

### 5. 프로덕션 빌드 확인

```bash
npm run build
npm start
```

## 사용 흐름 (MVP)

1. **시작하기** → `/login` 이메일 회원가입/로그인
2. **`/characters`** — 유나·나린·윤서·은하·지유 중 선택
3. **`/chat`** — 메시지 전송 → DeepSeek 스트리밍 응답
4. 새로고침해도 Supabase `messages`에서 최근 30개 대화 복원
5. 메시지 1회 왕복마다 호감도 +1, 관계 레벨 자동 갱신

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/login` | 이메일 로그인·회원가입 |
| `/characters` | 캐릭터 선택 |
| `/chat` | 채팅 (활성 캐릭터) |
| `POST /api/chat` | DeepSeek 스트리밍 |
| `GET /api/messages` | 최근 메시지 30개 |
| `POST /api/characters/select` | 캐릭터 선택 저장 |

## 호감도 · 관계 레벨

| 호감도 | 레벨 |
|--------|------|
| 0~20 | Lv1 |
| 21~40 | Lv2 |
| 41~70 | Lv3 |
| 71~90 | Lv4 |
| 91~100 | Lv5 |

## 감정 (MVP 규칙)

- 일반 대화: `happy`
- 칭찬·사랑 표현: `excited`
- 3시간+ 대화 공백 후 복귀: `hurt` (서운함)
- 키워드: 질투, 보고싶음 등 (`services/emotion.ts`)

## 아직 미구현 (의도적 제외)

- 결제·구독
- 선물·포옹모드
- 3일 미접속 이벤트

## Vercel 배포

1. GitHub 푸시
2. Vercel Import → Environment Variables에 `.env.local`과 동일 항목 등록 (`DEEPSEEK_API_KEY` 포함)
3. Deploy

## 라이선스

Private MVP — 상용 전 법적·플랫폼 정책 검토 권장.
