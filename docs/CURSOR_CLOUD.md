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

## 4. 블로그 자동화 (`blog/`)

블로그 스크립트·글 초안은 이 repo의 `blog/` 폴더에 있습니다.

```bash
cd blog
cp .env.example .env   # 로컬/Cloud Secrets에만 실제 값 입력 — push 금지
pip install -r requirements-selenium.txt
playwright install chromium   # Playwright 모드 사용 시
```

- **Cloud에서 가능:** 스크립트 수정, HTML 글 편집, Python 로직 개선
- **로컬 Windows만 가능:** Selenium 임시저장, Chrome CDP(9222), 작업 스케줄러 `SuN_Blog_Daily_7AM`

블로그 `.env` (네이버 계정)는 **절대 push 금지**. Cursor Cloud Secrets에 `NAVER_ID`, `NAVER_PW`, `BLOG_ID` 등록.

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
