# Selenium 블로그 자동 글 올리기

## 1. 패키지 설치

```bat
cd C:\Users\user\OneDrive\Desktop\blog
pip install -r requirements-selenium.txt
```

## 2. .env 설정 (비밀번호는 여기만)

```bat
copy .env.example .env
```

`.env` 파일을 열어 실제 값 입력:

```
NAVER_ID=실제아이디
NAVER_PW=실제비밀번호
BLOG_ID=hsrw1011
BLOG_POST_MODE=draft
HEADLESS=true
```

> `.env` 는 git에 올리지 마세요.

## 3. 수동 실행 (테스트)

```bat
scripts\run_selenium_blog.bat
```

또는

```bat
python scripts\selenium_blog_post.py
```

## 4. 매일 오전 7시 예약

### 방법 A — Windows 작업 스케줄러 (권장)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install_selenium_blog_task.ps1
```

작업 이름: `SuN_Blog_Selenium_7AM`

### 방법 B — Python schedule (PC 항상 켜짐 + 스크립트 상시 실행)

```bat
python scripts\selenium_blog_scheduler.py
```

## 동작

1. `posts/` 에 오늘 날짜 HTML (또는 `logs/latest_post.json` 지정 글) 읽기
2. Headless Chrome으로 네이버 로그인
3. 글쓰기 → 제목·본문 입력 → `images/` 이미지 첨부
4. `BLOG_POST_MODE=draft` → 임시저장 (기본) / `publish` → 발행

## 로그

- `logs/selenium_post.log`
- `logs/selenium_post.jsonl`

## 주의

- 네이버 **캡차·2단계 인증** 시 Headless 로그인이 실패할 수 있습니다.
  - 그때는 `.env` 에 `HEADLESS=false` 로 바꿔 확인하세요.
- 글 본문은 HTML에서 **텍스트만** 추출해 넣습니다 (스타일은 수동 HTML 붙여넣기 권장).
