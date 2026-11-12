# PickmeTalk 출시 백로그 (감독용)

Copilot Space·Cursor Agent·수동 개발 공통 기준. **하루 1건 이상** main에 반영할 항목을 위에서부터 처리합니다.

상태: `[ ]` 미완 · `[~]` PR 열림 · `[x]` main 반영

## P0 — 출시 차단

- [x] **일일 개발 스케줄러** — `.github/workflows/daily-development.yml` SyntaxError 수정 + `daily-supervisor.yml`
- [x] **프로필 성별·MBTI·이상형 → AI 프롬프트** — `services/context.ts` (가입 정보가 AI에 전달되도록)
- [x] **계정 삭제 안전 처리** — 부분 삭제 방지 (503/500/502) · PR #75
- [~] **프로덕션 Supabase 마이그레이션 동기** — 런북 `docs/SUPABASE_MIGRATION_LAUNCH.md` + `verify_supabase_migrations.mts` (원격 push는 운영자 실행)
- [ ] **플레이스토어 필수 자산** — `docs/launch/` (아이콘, 스크린샷, 개인정보처리방침 URL)
- [ ] **OAuth 로그인 스모크** — 카카오/구글 (`docs/AUTH_OAUTH.md`)

## P1 — 출시 직후 품질

- [x] **생활 패턴 → 채팅 프롬프트** — `patternNudges` + `user_daily_patterns` · PR #75
- [x] **관계 레벨업 UI** — LevelUpToast · #76
- [x] **사용자 감정 공감 힌트** — `userEmotionDetector` · #80
- [ ] **Web Push (사진 푸시 알림)** — `docs/PHOTO_PUSH.md` 로드맵 1번
- [ ] **일일 메시지 제한·프리미엄** — `docs/PAYMENT.md`

## P2 — 성장

- [ ] 사진 에셋 파이프라인 (~1000장/캐릭터)
- [ ] 7일/30일 리텐션 대시보드
- [ ] Stripe/국내 결제 실연동

## 운영 규칙

1. 작업 전 `AGENTS.md` + 이 파일 + 최근 `DAILY_LOG.md` 읽기
2. PR 제목: `[Daily Dev YYYY-MM-DD] <요약>`
3. 완료 시 이 파일에서 해당 줄을 `[x]`로 바꾸는 커밋 포함 (또는 후속 PR)
4. **드래프트 PR #60–#73**은 중복 시도 — 새 PR 전에 기존 브랜치 정리·close

## 왜 Copilot Space만으로는 안 돌아가나

GitHub Copilot Space는 **대화형**이며 스케줄 실행·PR 머지 권한이 없습니다. 자동화는 **GitHub Actions 이슈 생성** + **에이전트/개발자 PR** 조합으로 돌아갑니다. 자세한 지침: `docs/COPILOT_SUPERVISION.md`.
