# Android 릴리스 서명 (로컬 전용 — git 커밋 금지)

1. 키스토어 생성 (1회):

```bash
keytool -genkey -v -keystore pickmetalk-release.keystore \
  -alias pickmetalk -keyalg RSA -keysize 2048 -validity 10000
```

2. `android/keystore.properties` (gitignore, 예시):

```properties
storeFile=../pickmetalk-release.keystore
storePassword=***
keyAlias=pickmetalk
keyPassword=***
```

3. `android/app/build.gradle`에 `signingConfigs` release 연결 (팀 표준에 맞게 적용).

4. Play App Signing 사용 시: 첫 AAB 업로드 후 Google이 업로드 키 관리.

**주의:** 키스토어 파일과 비밀번호는 저장소·채팅에 올리지 마세요.
