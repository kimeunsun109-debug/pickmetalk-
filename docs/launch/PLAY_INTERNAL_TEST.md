# Play 내부 테스트 (1.0.0-beta.1)

## 현재 빌드

| 항목 | 값 |
|------|-----|
| versionName | 1.0.0-beta.1 |
| 패키지 | `com.pickmetalk.app` |
| 최소 SDK | 24 |
| 타겟 SDK | 36 |
| 출시 노트 예시 | `내부 테스트 1.0.0-beta.1` |

## 게시 전 확인

1. **검토** 화면에서 경고 확인  
   - 테스터 없음 → 게시해도 되지만 설치 링크를 받을 사람이 없음  
   - 가독화 파일 없음 → `minifyEnabled false` 베타에서는 무시 가능  
2. **저장 및 출시** → 내부 테스트 트랙에 게시

## 테스터 추가

1. Play Console → **테스트** → **내부 테스트** → **테스터** 탭  
2. **이메일 목록** 생성 (예: `pickmetalk-beta`)  
3. Gmail 주소 추가 (최대 100명, 즉시 반영)  
4. **테스트 참여 방법** 링크를 테스터에게 공유 (Opt-in URL)  
5. 테스터는 링크에서 **테스터 되기** 후 Play 스토어에서 설치

## 검토자 / 팀 계정

- Console **앱 액세스**에 프로덕션 테스트 계정 안내 (가입 또는 전용 계정)  
- 로컬 `tester@pickme.local` 은 앱에 없음 — 프로덕션에서 별도 생성

## 다음 베타 빌드

1. `android/app/build.gradle` → `versionCode` +1, `versionName` bump  
2. `npm run cap:sync:android:prod` → `./gradlew bundleRelease`  
3. 동일 트랙에 새 AAB 업로드 · 출시 노트에 변경 요약