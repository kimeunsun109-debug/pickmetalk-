#!/usr/bin/env python3
"""SuN 블로그 일일 자동 업무 — 오전 7시 또는 수동 실행"""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
LOGS = ROOT / "logs"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
PROFILE = Path.home() / "AppData/Local/naver-blog-chrome-debug"
CDP = "http://127.0.0.1:9222/json/version"


def log(msg: str, fh) -> None:
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line)
    fh.write(line + "\n")
    fh.flush()


def cdp_alive() -> bool:
    try:
        with urllib.request.urlopen(CDP, timeout=3) as r:
            return r.status == 200
    except Exception:
        return False


def ensure_chrome(fh) -> None:
    if cdp_alive():
        log("Chrome CDP(9222) 연결 OK", fh)
        return
    if not CHROME.exists():
        log("Chrome 실행 파일 없음 — 수동으로 디버그 모드 실행 필요", fh)
        return
    PROFILE.mkdir(parents=True, exist_ok=True)
    subprocess.Popen(
        [
            str(CHROME),
            "--remote-debugging-port=9222",
            f"--user-data-dir={PROFILE}",
            "https://nid.naver.com/nidlogin.login",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    log("Chrome 디버그 모드 시작 — 로그인 대기 15초", fh)
    import time

    for _ in range(15):
        time.sleep(1)
        if cdp_alive():
            log("Chrome CDP 준비 완료", fh)
            return
    log("Chrome CDP 미응답 — 로그인 후 재시도 권장", fh)


def run_step(cmd: list[str], fh) -> int:
    log("실행: " + " ".join(cmd), fh)
    return subprocess.call(cmd, cwd=str(SCRIPTS))


def load_latest_post() -> tuple[Path | None, list[str]]:
    meta = LOGS / "latest_post.json"
    if meta.exists():
        try:
            data = json.loads(meta.read_text(encoding="utf-8"))
            html = Path(data["html"])
            imgs = list(data.get("images", []))
            if html.exists():
                return html, imgs
        except Exception:
            pass
    posts = sorted(POSTS.glob("*_임시저장용.html"))
    if not posts:
        return None, []
    today = date.today().isoformat()
    today_posts = [p for p in posts if p.name.startswith(today)]
    html = today_posts[-1] if today_posts else posts[-1]
    return html, []


POSTS = ROOT / "posts"


def main() -> int:
    LOGS.mkdir(parents=True, exist_ok=True)
    report = LOGS / f"daily_run_{date.today().isoformat()}.txt"
    py = sys.executable
    auto = SCRIPTS / "naver_blog_automation.py"
    gen = SCRIPTS / "blog_generate_post.py"

    with report.open("a", encoding="utf-8") as fh:
        log("=== SuN 블로그 일일 업무 시작 ===", fh)
        ensure_chrome(fh)

        # 1) 오늘 글 + 이미지 생성
        code = run_step([py, str(gen)], fh)
        if code != 0:
            log(f"경고: 글 생성 종료코드 {code}", fh)

        html, imgs = load_latest_post()
        if html:
            log(f"오늘 글: {html.name}", fh)
        else:
            log("오늘 글 없음", fh)

        # 2) 내 글 댓글 이웃 → 답글 + 이웃글 방문
        run_step([py, str(auto), "--mode", "reply-commenters", "--limit", "15"], fh)

        # 3) IT 이웃 글 댓글 + 하트
        run_step([py, str(auto), "--mode", "visit-it-all"], fh)

        # 4) 이웃신청 10명
        run_step([py, str(auto), "--mode", "apply", "--limit", "10"], fh)

        # (선택) 임시저장 시도 — 실패해도 posts/ 파일은 준비됨
        if html:
            img_arg = ",".join(imgs)
            cmd = [py, str(auto), "--mode", "draft", "--html", str(html)]
            if img_arg:
                cmd += ["--images", img_arg]
            run_step(cmd, fh)

        log("=== 일일 업무 완료 ===", fh)
    print(f"\n보고서: {report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
