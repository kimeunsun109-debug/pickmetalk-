# GitHub Copilot Space 감독 가이드

Space URL(예: `https://github.com/copilot/spaces/...`)에 “하루에 하나씩 해줘”라고 적어도 **Copilot이 스스로 매일 실행되지는 않습니다**. Space는 질문·코드 제안용 채팅이고, cron·이슈 생성·PR 머지는 **GitHub Actions + 사람/Cloud Agent** 영역입니다.

## 현재 저장소에 있는 자동화

| 구성 요소 | 역할 |
|-----------|------|
| `daily-development.yml` | 매일 09:00 KST `[Daily Dev 날짜]` 이슈 생성 |
| `daily-supervisor.yml` | 하루 이상 미완료 Daily Dev 이슈에 알림, 이슈 생성 실패 시 백업 이슈 |
| `docs/LAUNCH_BACKLOG.md` | 출시 우선순위 체크리스트 |
| `DAILY_LOG.md` | 완료 기록 (PR 링크 필수) |

## Copilot에게 시킬 때 (Space / Copilot Chat)

매 세션 시작 시 아래를 붙여넣기:

```
오늘 날짜(KST)의 열린 GitHub 이슈 [Daily Dev ...] 또는 docs/LAUNCH_BACKLOG.md P0에서 항목 1개만 구현해.
규칙: AGENTS.md, 최소 diff, npx tsc --noEmit && npm run lint, DAILY_LOG.md 갱신, PR 생성.
.env/시크릿/DB 파괴 금지.
```

저장소 루트 `.github/copilot-instructions.md`도 Copilot이 컨텍스트로 읽습니다.

## Cursor Cloud Agent (본 감독)

- 일일 워크플로 실패 원인 수정·백로그 추적·P0 기능 직접 구현
- 사용자가 Space만 켜둔 경우에도 **Actions + Agent PR**로 진행 상황을 유지

## 과거에 멈춘 이유 (2026-11-07~)

`daily-development.yml` 본문의 `\\`AGENTS.md\\`` 이스케이트 때문에 `actions/github-script`가 **SyntaxError**로 매일 실패했습니다. 11-03 이슈 #70만 생성되고 이후 날짜 이슈는 없었습니다.
