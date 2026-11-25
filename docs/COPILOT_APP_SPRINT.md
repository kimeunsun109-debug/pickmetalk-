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
| 3 | #91 | **Play 내부 테스트 운영 가이드** ✅ | `docs/launch/PLAY_INTERNAL_TEST.md` — 테스터 추가, opt-in 링크, 출시 노트 템플릿 |
| 4 | — | **Web Push 1단계** ✅ | `WebPushEnableButton` 오류 UX, 구독 실패 시 안내 (`docs/PHOTO_PUSH.md` 1절) |
| 5 | — | **채팅 온보딩 copy polish** ✅ | `components/chat` 온보딩/킥라인 텍스트, 이미지 변경 없음 |
| 6 | — | **일일 메시지 한도 UI** ✅ | 설정 화면에 리셋 시각·한도 설명 명확화 (`FREE_DAILY_MESSAGE_LIMIT`) |
| 7 | #103 | **채팅 무료 한도 안내** ✅ | `FreeUsageBanner`·`PremiumModal`·`messages/ko.json` — 10/5회·한도 도달 문구에 **KST 자정 리셋** 안내, 결제 미연동은 `paymentPreparing` 톤 유지 |
| 8 | #104 | **단일 기기 세션 UX** | `DeviceSessionGuard` 끊김 오버레이 문구 다듬기 + 로그인 CTA; 로직 변경 없음 |
| 9 | #105 | **Premium CTA 스텁 정리** | `PremiumModal`·설정 Premium 카드: `POST /api/premium/checkout` 503 시 사용자 안내 일관화 (`docs/PAYMENT.md`) |

**스프린트 1 (#89–#91, #4–#6)** 완료. **스프린트 2**는 #7부터.

---

## Copilot Space 붙여넣기

```
main pull 후 docs/COPILOT_APP_SPRINT.md에서 미완 중 맨 위 1건만 (#7→#8→#9).
대응 이슈 #103→#104→#105 확인.
AGENTS.md, docs/LAUNCH_BACKLOG.md 읽고 최소 diff. tsc + lint. DAILY_LOG.md + PR [Daily Dev YYYY-MM-DD] ….
캐릭터 이미지·public/ 에셋·스토어 PNG·실결제 연동 금지.
```

### 오늘 #7 전용

```
이슈 #103: 채팅 무료 한도 안내
- components/chat/FreeUsageBanner.tsx, PremiumModal.tsx, messages/ko.json (필요 시 ChatProvider)
- PAYMENT.md: 10·5회 배너는 유지, 문구에 자정 리셋·설정 링크(/settings) 고려
- 한도 계산·API 변경 없음
```

---

## Play Console (운영자 — 코드 없음)

- 내부 테스트 **저장 및 출시** 후 **테스터** 탭에 Gmail 목록 추가
- 가독화 파일: `minifyEnabled` 켜기 전까지 경고 무시 가능 → 베타 이후 R8 + mapping.txt