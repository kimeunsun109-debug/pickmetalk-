# Google Play 출시 체크리스트 (픽미톡)

**패키지명 (변경 불가):** `com.pickmetalk.app`  
**개인정보처리방침 URL:** https://pickmetalk.com/privacy  
**이용약관 URL:** https://pickmetalk.com/terms  

관련 문서: `play-store-listing.md`, `screenshot-copy.md`, `icon-concepts.md`, `data-safety-play-console.md`

---

## 1. 사전 준비

- [ ] Google Play Console 개발자 계정 (일회 등록비)
- [ ] 앱 서명 키 (Play App Signing 권장) — `android/KEYSTORE.md` 참고
- [ ] 상표 **픽미톡** · 사업자 정보 (`privacy-policy.md` 운영자 표와 일치)

---

## 2. 스토어 등록 정보 (복붙)

| 필드 | 값 |
|------|-----|
| 앱 이름 | `픽미톡 - 감성 AI 채팅` (15자) |
| 짧은 설명 | `play-store-listing.md` §짧은 설명 |
| 전체 설명 | `play-store-listing.md` §전체 설명 |
| 카테고리 | 엔터테인먼트 (보조: 소셜) |
| 연락 이메일 | kimeunsun109@gmail.com |
| 웹사이트 | https://pickmetalk.com |

---

## 3. 그래픽 자산

| 자산 | 규격 | 상태 |
|------|------|------|
| 앱 아이콘 | 512×512 PNG | `android/mipmap-*` (1024 원본은 `store-assets/`에 보관 권장) |
| 기능 그래픽 | 1024×500 | 미제작 → `icon-concepts.md` A안 기반 제작 |
| 스크린샷 | 1080×1920, 4~8장 | `screenshot-copy.md` 문구 + 실제 UI 캡처 |
| 프로모 영상 | 선택 | — |

제작 후 `store-assets/play/` 폴더에 넣고 Play Console에 업로드 (git에는 PNG 제외 가능 — `store-assets/.gitkeep`만)

---

## 4. 정책·등급

- [ ] **개인정보처리방침** URL 입력 (웹 `/privacy`와 내용 일치)
- [ ] **데이터 보안** 설문: `data-safety-play-console.md`
- [ ] **콘텐츠 등급**: 12+ (로맨스 텍스트, 성적 콘텐츠 없음)
- [ ] **타겟 연령**: 청소년 제외 여부는 설문에 따라 선택 (연애 시뮬 성인 대상 권장)
- [ ] **광고**: 현재 없음
- [ ] **앱 액세스**: 전체 기능 로그인 필요 → 테스트 계정 제공 (`tester@pickme.local` 등 **프로덕션 전용 테스트 계정** 별도 생성 권장)

---

## 5. Android 빌드 (Capacitor)

### 프로덕션 서버 URL

릴리스 빌드는 **반드시** `https://pickmetalk.com` 을 로드합니다. 로컬 `10.0.2.2`는 개발 전용.

```bash
npm run cap:sync:android:prod   # capacitor.config + cap sync
cd android && ./gradlew bundleRelease   # AAB 업로드용
```

또는 Android Studio → Build → Generate Signed Bundle / APK.

### 버전

- `android/app/build.gradle` → `versionCode` (정수, 매 업로드 +1), `versionName` (표시용, 예: `1.0.0`)

---

## 6. 출시 트랙

1. **내부 테스트** → 팀 설치 확인 (로그인·채팅·탈퇴)
2. **비공개 테스트** (선택)
3. **프로덕션** — 단계적 출시 10% → 100%

---

## 7. 출시 후

- [ ] Play Console 통계·ANR/Crash 모니터링
- [ ] `pickmetalk.com` SSL 및 `/privacy` 접근 확인
- [ ] Vercel `icn1` + Supabase Seoul 리전 지연 (`docs/VERCEL_DEPLOY.md`)

---

## 완료 시

`docs/LAUNCH_BACKLOG.md`의 **플레이스토어 필수 자산** 항목을 `[x]`로 갱신 (Console에 첫 AAB 업로드 후).
