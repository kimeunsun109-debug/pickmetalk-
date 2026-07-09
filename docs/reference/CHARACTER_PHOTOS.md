# 캐릭터 실사 프로필 이미지

구현 예시: 로컬 `C:\Users\user\ai_girlfriend_app\docs\픽미톡 ai 이미지예시\구현예시.png`

## 배치 경로

각 캐릭터별 **정사각 크롭 · 얼굴 위주** 실사 이미지:

```
public/characters/yuna/profile.webp
public/characters/narin/profile.webp
public/characters/yoonseo/profile.webp
public/characters/eunha/profile.webp
public/characters/jiyu/profile.webp
```

`CharacterAvatar` 로딩 순서: `.webp` → `.jpg` → `.svg` → 이니셜

## 현재 (베타)

- `profile.svg` — 기존 일러스트 placeholder
- 고화질 실사 준비 시 **같은 파일명으로 webp만 교체** (코드 변경 없음)

## 권장 스펙

| 항목 | 값 |
|------|-----|
| 비율 | 1:1 |
| 해상도 | 512×512 이상 |
| 포맷 | WebP (quality 85+) |
| 스타일 | 실사, 자연광, 구현예시 PNG 톤 맞춤 |

## 동기화

OneDrive `픽미톡 ai` 폴더 → 위 `public/characters/` 경로에 복사 후 커밋.
