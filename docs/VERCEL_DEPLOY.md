# Vercel 배포 가이드 (app-girl-friend)

프로젝트: [kimeunsun-s-projects/app-girl-friend](https://vercel.com/kimeunsun-s-projects/app-girl-friend)

## 실패 원인 (2026-07-04)

| 항목 | 내용 |
|------|------|
| Deployment ID | `dpl_8sX3eet6FTM7e5knF5YnEvWorJgZ` |
| 상태 | **Build Failed** |
| 원인 | `app/api/chat/route.ts` — `trace.span()` 반환 타입 `unknown` → `next build` TypeScript 실패 |

로컬 재현: `npm run build` → 동일 오류.  
수정: `trace.span<PostgrestSingleResponse<...>>` 등 **명시적 제네릭** 추가 (`cursor/vercel-deploy-fix-e030`).

## 자동 배포 설정

### 1) Git 연결 (필수)

Vercel 대시보드에 **Connect Git**이 보이면 아직 GitHub 연동이 안 된 상태입니다.

1. [Project Settings → Git](https://vercel.com/kimeunsun-s-projects/app-girl-friend/settings/git)
2. **Connect Git Repository** → `kimeunsun109-debug/app_girl-friend`
3. **Production Branch**: `main`
4. **Automatically deploy**: Enabled

`vercel.json`의 `git.deploymentEnabled.main`은 연결 후 main 푸시 시 프로덕션 배포를 켭니다.

### 2) 환경 변수 (필수)

[Environment Variables](https://vercel.com/kimeunsun-s-projects/app-girl-friend/settings/environment-variables)

| 변수 | Production | 비고 |
|------|:----------:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | |
| `DEEPSEEK_API_KEY` | ✅ | 서버 전용 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서버 전용 (선택 API) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://pickmetalk.com` 권장 |
| `DEEPSEEK_BASE_URL` | 선택 | |
| `TAVILY_API_KEY` | 선택 | |

### 3) 빌드 설정

| 항목 | 값 |
|------|-----|
| Framework | Next.js (자동) |
| Build Command | `npm run build` (`prebuild` → kicklines sync) |
| Install Command | `npm install` |
| Node.js | 20.x (권장) |

`prebuild`는 Python 없이도 `data/kickLines/master.json` 커밋본을 사용합니다 (`scripts/run_sync_kicklines.mjs`).

### 4) 리전 (Supabase RTT 최적화)

| 서비스 | 리전 | 코드 |
|--------|------|------|
| **Supabase** (DB) | 서울 | `ap-northeast-2` |
| **Vercel Functions** (권장) | 서울 | `icn1` |

`vercel.json`에 `"regions": ["icn1"]` 설정됨.  
이전 기본값(미국 `iad1` 등)이면 Supabase까지 **300~600ms RTT**가 날 수 있습니다. `icn1` 배포 후 **수십 ms대**로 줄어드는 것이 정상입니다.

확인:

```bash
npx tsx scripts/check_regions.mts
```

### 5) 배포 흐름 (연동 후)

```
PR 머지 (draft 해제 필수)  →  git push origin main  →  Vercel Production  →  pickmetalk.com
PR / feature branch       →  Preview URL (*.vercel.app) 만 (프로덕션 미반영)
```

**PR이 프로덕션에 안 보일 때**

1. PR이 **Draft**면 GitHub에서 머지 불가 → `gh pr ready <번호>` 후 머지
2. **Production Branch**가 `main`인지 [Git 설정](https://vercel.com/kimeunsun-s-projects/app-girl-friend/settings/git) 확인
3. 머지 후 검증:

```bash
npm run verify:prod
npm run verify:migrations
```

## 수동 배포 (비상)

```bash
npx vercel login
npx vercel link --project app-girl-friend
npx vercel --prod
```

## Supabase Auth 리다이렉트

`supabase/config.toml`에 이미 포함:

- `https://pickmetalk.com/**`
- `https://*.vercel.app/**`

커스텀 도메인 추가 시 Supabase Dashboard → Authentication → URL Configuration에도 동일 URL 추가.
