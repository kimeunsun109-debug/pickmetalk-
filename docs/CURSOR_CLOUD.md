# Cursor Cloud에서 이어서 작업하기

## 1. GitHub

이 저장소: `https://github.com/kimeunsun109-debug/app_girl-friend.git`

Cloud Agent는 **main** 브랜치를 clone 합니다.

## 2. 환경 변수 (Cursor Cloud Secrets)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon key |
| `DEEPSEEK_API_KEY` | ✅ | AI 채팅 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 배포 URL 또는 `http://localhost:3000` |
| `TAVILY_API_KEY` | ⬜ | 웹 검색 |
| `SUPABASE_SERVICE_ROLE_KEY` | ⬜ | 서버 작업 |

로컬: `.env.example` → `.env.local` 복사

## 3. DB 마이그레이션

새 테이블 `user_daily_patterns` 포함:

```bash
# Supabase CLI 연결 후
npx supabase db push
# 또는 SQL Editor에서 supabase/migrations/006_user_daily_patterns.sql 실행
```

## 4. 블로그 자동화 (별도 폴더)

블로그 작업은 **이 repo 밖** OneDrive에 있습니다:

```
C:\Users\user\OneDrive\Desktop\blog
```

Cloud에서 블로그까지 하려면:

1. `blog` 폴더를 이 repo에 `blog/` 로 추가 push, 또는
2. 별도 GitHub repo 생성 후 clone

블로그 `.env` (네이버 계정)는 **절대 push 금지**.

## 5. 일일 블로그 업무 (로컬 Windows)

- 스케줄러: `SuN_Blog_Daily_7AM`
- Chrome CDP: `9222`, 프로필 `%LOCALAPPDATA%\naver-blog-chrome-debug`
- Selenium 프로필: `%LOCALAPPDATA%\naver-blog-selenium-profile`

## 6. Agent에게 시킬 때 예시

```
AGENTS.md 읽고 daily pattern + chat route 이어서 작업해줘
```

```
blog 폴더 추가 후 naver selenium 임시저장 안정화해줘
```
