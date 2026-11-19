# Play 내부 테스트 (1.0.0-beta.1)

> 전체 출시 준비 항목은 [`PLAY_STORE_CHECKLIST.md`](./PLAY_STORE_CHECKLIST.md)를
> 기준으로 확인합니다. 이 문서는 내부 테스트 트랙 운영 절차만 다룹니다.

## 현재 빌드

| 항목 | 값 |
|------|-----|
| versionName | 1.0.0-beta.1 |
| 패키지 | `com.pickmetalk.app` |
| 최소 SDK | 24 |
| 타겟 SDK | 36 |
| 출시 노트 예시 | `내부 테스트 1.0.0-beta.1` |

## 게시 전 체크리스트

- [ ] `versionCode`가 이전 업로드보다 큰지 확인
- [ ] `versionName`과 출시 노트를 이번 빌드에 맞게 갱신
- [ ] `npm run cap:sync:android:prod`로 프로덕션 URL을 포함해 동기화
- [ ] `./gradlew bundleRelease`로 AAB 생성 및 서명 확인
- [ ] Play Console **검토** 화면에서 차단 오류가 없는지 확인
- [ ] 테스터 이메일 목록과 Opt-in URL을 준비
- [ ] **저장 및 출시**로 내부 테스트 트랙에 게시

## 테스터 추가

1. Play Console → **테스트** → **내부 테스트** → **테스터** 탭  
2. **이메일 목록** 생성 (예: `pickmetalk-beta`)  
3. Gmail 주소 추가 (최대 100명, 즉시 반영)
4. **테스트 참여 방법**에서 Opt-in URL 복사
5. 아래 공유 문구에 URL을 붙여 테스터에게 전달
6. 테스터는 링크에서 **테스터 되기** 후 Play 스토어에서 설치

### 테스터 전달 템플릿

```text
픽미톡 내부 테스트에 초대합니다.

1. 아래 링크를 엽니다.
2. Google 계정으로 테스트 참여를 선택합니다.
3. Play 스토어에서 픽미톡을 설치합니다.

Opt-in URL: <PLAY_CONSOLE_OPT_IN_URL>
테스트 계정: 운영자가 별도로 전달한 프로덕션 전용 계정
```

테스터가 설치할 수 없으면 초대한 Google 계정과 Play 스토어 계정이
동일한지, 링크에 **테스터 되기**가 완료됐는지, Play Console에서 목록이
저장됐는지를 먼저 확인합니다.

## 검토자 / 팀 계정

- Console **앱 액세스**에 프로덕션 테스트 계정 안내 (가입 또는 전용 계정)  
- 로컬 `tester@pickme.local` 은 앱에 없음 — 프로덕션에서 별도 생성

## 출시 노트 템플릿

```text
내부 테스트 <versionName>

- 주요 변경: <이번 빌드에서 확인할 기능>
- 수정 사항: <테스터가 확인할 버그 수정>
- 확인 요청: 로그인, 캐릭터 선택, 채팅, 로그아웃/재로그인
- 알려진 제한: <있으면 기재, 없으면 없음>
```

## 다음 베타 빌드

1. `android/app/build.gradle` → `versionCode` +1, `versionName` bump  
2. `npm run cap:sync:android:prod` → `./gradlew bundleRelease`  
3. 동일 트랙에 새 AAB 업로드 · 출시 노트 템플릿으로 변경 요약