# Copilot 앱 스프린트 (캐릭터 이미지 제작 중)

**배경:** Play 내부 테스트 AAB `1.0.0-beta.1` 업로드 완료. 캐릭터 포트레이트·스토어 스크린샷은 별도 제작 중이므로 **코드 작업은 기능·OAuth·설정·푸시 기반**만 진행합니다.

**규칙:** 하루에 정확히 1건 · PR `[Daily Dev YYYY-MM-DD] …` · `DAILY_LOG.md` · `npx tsc --noEmit && npm run lint`

이미지/에셋 작업은 이 문서 범위 밖 (파이프라인 P2).

---

## 우선순위 큐 (위에서 1개만)

| # | 이슈 | 작업 | 수용 기준 |
|---|------|------|-----------|
| 1 | #89 | **설정: 프로필 편집 UI** (닉네임·성별·MBTI·이상형) | `/settings`에서 PATCH `/api/profile` 연동, 가입 폼과 동일 옵션, 저장 토스트 |
| 2 | #90 | **OAuth 스모크** ✅ | `npm run test:oauth` 문서화 + `docs/AUTH_OAUTH.md` 체크리스트에 Vercel 검증 절 추가; 스크립트가 redirect URL만 검증해도 됨 (실제 로그인은 수동) |
| 3 | #91 | **Play 내부 테스트 운영 가이드** | `docs/launch/PLAY_INTERNAL_TEST.md` — 테스터 추가, opt-in 링크, 출시 노트 템플릿 |
| 4 | — | **Web Push 1단계** | `WebPushEnableButton` 오류 UX, 구독 실패 시 안내 (`docs/PHOTO_PUSH.md` 1절) |
| 5 | — | **채팅 온보딩 copy polish** | `components/chat` 온보딩/킥라인 только 텍스트, 이미지 변경 없음 |
| 6 | — | **일일 메시지 한도 UI** | 설정 화면에 리셋 시각·한도 설명 명확화 (`FREE_DAILY_MESSAGE_LIMIT`) |

---

## Copilot Space 붙여넣기

```
오늘은 docs/COPILOT_APP_SPRINT.md 큐에서 맨 위 미완 항목 1개만 구현해.
열린 이슈 #89→#90→#91 중 아직 PR이 없는 것을 우선해.
AGENTS.md, docs/LAUNCH_BACKLOG.md 읽고 최소 diff. tsc + lint. DAILY_LOG.md + PR.
캐릭터 이미지·public/ 에셋·스토어 PNG는 건드리지 마.
```

---

## Play Console (운영자 — 코드 없음)

- 내부 테스트 **저장 및 출시** 후 **테스터** 탭에 Gmail 목록 추가
- 가독화 파일: `minifyEnabled` 켜기 전까지 경고 무시 가능 → 베타 이후 R8 + mapping.txt