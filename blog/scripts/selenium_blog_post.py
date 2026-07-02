#!/usr/bin/env python3
"""
네이버 블로그 Selenium 자동 글 올리기
- 계정: .env (NAVER_ID, NAVER_PW, BLOG_ID)
- Headless Chrome 기본
- posts/ 폴더 오늘 글 HTML + images/ 첨부
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import date, datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver import ChromeOptions
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
POSTS = ROOT / "posts"
IMAGES = ROOT / "images"
LOGS = ROOT / "logs"

load_dotenv(ROOT / ".env")

NAVER_ID = os.getenv("NAVER_ID", "").strip()
NAVER_PW = os.getenv("NAVER_PW", "").strip()
BLOG_ID = os.getenv("BLOG_ID", "hsrw1011").strip()
POST_MODE = os.getenv("BLOG_POST_MODE", "draft").strip().lower()
HEADLESS = os.getenv("HEADLESS", "true").strip().lower() in ("1", "true", "yes")
CHROME_PROFILE = os.getenv(
    "CHROME_USER_DATA_DIR",
    str(Path.home() / "AppData/Local/naver-blog-selenium-profile"),
).strip()

LOGIN_URL = "https://nid.naver.com/nidlogin.login"
WRITE_URL = f"https://blog.naver.com/{BLOG_ID}?Redirect=Write&"
WRITE_DIRECT = (
    f"https://blog.naver.com/PostWriteForm.naver?blogId={BLOG_ID}"
    f"&Redirect=Write&redirect=Write&widgetTypeCall=true&from=top"
)


def log(msg: str) -> None:
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line)
    LOGS.mkdir(parents=True, exist_ok=True)
    with (LOGS / "selenium_post.log").open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def require_env() -> None:
    if not NAVER_ID or not NAVER_PW:
        raise RuntimeError(
            ".env 파일에 NAVER_ID, NAVER_PW 를 설정하세요. "
            f"예시: {ROOT / '.env.example'}"
        )
    if NAVER_ID.startswith("your_") or NAVER_PW.startswith("your_"):
        raise RuntimeError(".env 에 실제 네이버 계정 정보를 입력하세요.")


def create_driver() -> webdriver.Chrome:
    opts = ChromeOptions()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--lang=ko-KR")
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    if CHROME_PROFILE:
        Path(CHROME_PROFILE).mkdir(parents=True, exist_ok=True)
        opts.add_argument(f"--user-data-dir={CHROME_PROFILE}")
        opts.add_argument("--profile-directory=Default")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    driver.set_page_load_timeout(60)
    return driver


def html_to_plain(html: str) -> str:
    body_m = re.search(r"<body[^>]*>(.*)</body>", html, re.I | re.S)
    body = body_m.group(1) if body_m else html
    text = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
    text = re.sub(r"</p>", "\n\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def parse_html_file(path: Path) -> tuple[str, str]:
    html = path.read_text(encoding="utf-8")
    title_m = re.search(r"<title>([^<]+)</title>", html, re.I)
    title = title_m.group(1).strip() if title_m else "제목 없음"
    return title, html_to_plain(html)


def find_today_post() -> tuple[Path, list[Path]]:
    meta = LOGS / "latest_post.json"
    if meta.exists():
        try:
            data = json.loads(meta.read_text(encoding="utf-8"))
            html = Path(data["html"])
            imgs = [IMAGES / n for n in data.get("images", [])]
            if html.exists():
                return html, [p for p in imgs if p.exists()]
        except Exception:
            pass
    today = date.today().isoformat()
    candidates = sorted(POSTS.glob(f"{today}_*_임시저장용.html"))
    if not candidates:
        candidates = sorted(POSTS.glob("*_임시저장용.html"))
    if not candidates:
        raise FileNotFoundError(f"posts/ 에 올릴 HTML이 없습니다: {POSTS}")
    html = candidates[-1]
    img_paths = sorted(IMAGES.glob("*.png"))[:5]
    return html, img_paths


def switch_to_write_frame(driver: webdriver.Chrome, wait: WebDriverWait) -> None:
    driver.switch_to.default_content()
    try:
        wait.until(
            EC.frame_to_be_available_and_switch_to_it(
                (By.CSS_SELECTOR, "iframe[src*='PostWriteForm']")
            )
        )
        return
    except TimeoutException:
        driver.switch_to.default_content()

    try:
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "mainFrame")))
        wait.until(
            EC.frame_to_be_available_and_switch_to_it(
                (By.CSS_SELECTOR, "iframe[src*='PostWriteForm']")
            )
        )
        return
    except TimeoutException:
        driver.switch_to.default_content()

    if driver.find_elements(By.CSS_SELECTOR, ".se-title-text, .se-section-documentTitle"):
        return

    srcs = [
        (fr.get_attribute("src") or "")[:120]
        for fr in driver.find_elements(By.TAG_NAME, "iframe")
    ]
    raise RuntimeError(
        "글쓰기 에디터 iframe(PostWriteForm)을 찾지 못했습니다. "
        f"iframes={srcs[:8]}"
    )


def is_logged_in(driver: webdriver.Chrome) -> bool:
    driver.get(WRITE_URL)
    time.sleep(4)
    url = driver.current_url
    if "nidlogin" in url:
        return False
    if driver.find_elements(By.CSS_SELECTOR, "iframe[src*='PostWriteForm']"):
        return True
    if driver.find_elements(By.CSS_SELECTOR, ".se-title-text"):
        return True
    return "PostWriteForm" in url


def login(driver: webdriver.Chrome, wait: WebDriverWait) -> None:
    if is_logged_in(driver):
        log("세션 로그인 유지")
        return

    log("네이버 로그인 시도")
    driver.get(LOGIN_URL)
    wait.until(EC.presence_of_element_located((By.ID, "id")))
    driver.execute_script(
        "document.getElementById('id').value = arguments[0];"
        "document.getElementById('pw').value = arguments[1];",
        NAVER_ID,
        NAVER_PW,
    )
    time.sleep(0.8)
    driver.find_element(By.ID, "log.login").click()
    time.sleep(5)

    if driver.find_elements(By.ID, "captcha") or driver.find_elements(By.CSS_SELECTOR, "#captcha"):
        log("캡차 감지 — 90초 동안 브라우저에서 직접 로그인해 주세요...")
        time.sleep(90)

    if "nidlogin" in driver.current_url:
        raise RuntimeError(
            "로그인 실패 — 아이디/비밀번호 또는 2단계 인증을 확인하세요. "
            "HEADLESS=false 로 수동 로그인 후 재시도하세요."
        )
    log("로그인 성공")


def open_write_page(driver: webdriver.Chrome, wait: WebDriverWait) -> None:
    urls = [
        WRITE_DIRECT,
        WRITE_URL,
        f"https://blog.naver.com/GoBlogWrite.naver",
    ]
    for url in urls:
        driver.get(url)
        time.sleep(8)
        log(f"글쓰기 페이지 시도: {driver.current_url[:100]}")
        if driver.find_elements(By.CSS_SELECTOR, "iframe[src*='PostWriteForm']"):
            return
        if driver.find_elements(By.CSS_SELECTOR, ".se-title-text"):
            return
    # 블로그 홈에서 글쓰기 링크 클릭
    driver.get(f"https://blog.naver.com/{BLOG_ID}")
    time.sleep(4)
    for sel in (
        "a[href*='Redirect=Write']",
        "a[href*='PostWriteForm']",
        "a.item_write",
    ):
        links = driver.find_elements(By.CSS_SELECTOR, sel)
        if links:
            links[0].click()
            time.sleep(8)
            log(f"글쓰기 링크 클릭 후: {driver.current_url[:100]}")
            return


def fill_editor(driver: webdriver.Chrome, wait: WebDriverWait, title: str, body: str) -> None:
    open_write_page(driver, wait)
    switch_to_write_frame(driver, wait)

    for sel in (".se-title-text", ".se-section-documentTitle [contenteditable='true']"):
        try:
            el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, sel)))
            driver.execute_script(
                "arguments[0].scrollIntoView({block:'center'});"
                "arguments[0].click();"
                "arguments[0].textContent = arguments[1];"
                "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));",
                el,
                title[:200],
            )
            break
        except TimeoutException:
            continue

    for sel in (
        ".se-section-text .se-text-paragraph",
        ".se-component.se-text .se-text-paragraph",
        ".se-text-paragraph",
    ):
        try:
            els = driver.find_elements(By.CSS_SELECTOR, sel)
            target = els[0] if els else None
            if target:
                driver.execute_script(
                    "arguments[0].scrollIntoView({block:'center'});"
                    "arguments[0].click();"
                    "arguments[0].textContent = arguments[1];"
                    "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));",
                    target,
                    body[:8000],
                )
                break
        except Exception:
            continue

    log(f"제목·본문 입력 완료: {title[:40]}...")


def upload_images(driver: webdriver.Chrome, image_paths: list[Path]) -> None:
    if not image_paths:
        return
    driver.switch_to.default_content()
    switch_to_write_frame(driver, WebDriverWait(driver, 20))
    for img_path in image_paths:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, "button.se-image-toolbar-button")
            btn.click()
            time.sleep(1)
            file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
            file_input.send_keys(str(img_path.resolve()))
            time.sleep(2)
            log(f"이미지 업로드: {img_path.name}")
        except NoSuchElementException:
            log(f"이미지 업로드 스킵: {img_path.name}")
        except Exception as e:
            log(f"이미지 업로드 실패 ({img_path.name}): {e}")


def click_save_or_publish(driver: webdriver.Chrome) -> bool:
    driver.switch_to.default_content()
    switch_to_write_frame(driver, WebDriverWait(driver, 15))
    if POST_MODE == "publish":
        selectors = ("button.publish_btn__m9KHH", "button[class*='publish_btn__']")
        label = "발행"
    else:
        selectors = ("button.save_btn__bzc5B", "button[class*='save_btn__']")
        label = "임시저장"

    for sel in selectors:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, sel)
            btn.click()
            time.sleep(3)
            log(f"{label} 버튼 클릭 완료")
            return True
        except NoSuchElementException:
            continue
    log(f"{label} 버튼을 찾지 못했습니다.")
    return False


def run_post() -> bool:
    require_env()
    html_path, image_paths = find_today_post()
    title, body = parse_html_file(html_path)
    log(f"=== Selenium 블로그 업로드 시작 | {html_path.name} | mode={POST_MODE} ===")

    driver = create_driver()
    wait = WebDriverWait(driver, 40)
    try:
        login(driver, wait)
        fill_editor(driver, wait, title, body)
        upload_images(driver, image_paths)
        ok = click_save_or_publish(driver)
        _append_result(html_path, title, ok)
        return ok
    except Exception as e:
        try:
            LOGS.mkdir(parents=True, exist_ok=True)
            driver.save_screenshot(str(LOGS / "selenium_write_fail.png"))
            log("스크린샷 저장: logs/selenium_write_fail.png")
        except Exception:
            pass
        raise e
    finally:
        driver.quit()


def _append_result(html_path: Path, title: str, ok: bool) -> None:
    entry = {
        "date": date.today().isoformat(),
        "ts": datetime.now().isoformat(timespec="seconds"),
        "title": title,
        "html": str(html_path),
        "mode": POST_MODE,
        "headless": HEADLESS,
        "ok": ok,
    }
    path = LOGS / "selenium_post.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def main() -> int:
    try:
        ok = run_post()
        return 0 if ok else 1
    except Exception as e:
        log(f"오류: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
