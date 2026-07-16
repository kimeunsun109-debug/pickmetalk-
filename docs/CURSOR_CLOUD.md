# Cursor Cloud에서 이어서 작업하기

## 1. GitHub

이 저장소: `https://github.com/kimeunsun109-debug/pickmetalk.git`

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

마이그레이션 파일: `supabase/migrations/` (003–008). 유저 프로필 확장은 **`008_user_profile_signup.sql`** (`public.profiles` 테이블).

```bash
# 로컬 CLI (Dashboard Access Token sbp_0102... 형식 + DB 비밀번호 필요)
npx supabase login --token "$SUPABASE_ACCESS_TOKEN"
npx supabase link --project-ref <ref> -p "$SUPABASE_DB_PASSWORD"
npx supabase db push --yes

# Cloud VM: IPv6/Pooler 제한 시 Management API로 배포 (이미 007·008 적용됨)
npx tsx scripts/verify_supabase_migrations.mts
```

**원격 히스토리 정렬:** API로 적용된 타임스탬프 버전(`20260705...`)은 `007`/`008`로 `schema_migrations`에서 rename 완료. 로컬 파일명과 원격 version이 일치해야 `db push`가 스킵/동기화됩니다.

Pooler 호스트(이 프로젝트): `aws-1-ap-northeast-2.pooler.supabase.com:6543` (Dashboard → Connect 참고).

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
