#!/usr/bin/env python3
"""
매일 지정 시각에 selenium_blog_post.py 실행 (schedule 라이브러리)

사용:
  python selenium_blog_scheduler.py          # 스케줄러 상시 실행
  python selenium_blog_scheduler.py --once   # 즉시 1회만 실행

PC가 항상 켜져 있어야 합니다.
권장: Windows 작업 스케줄러 (install_selenium_blog_task.ps1)
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import schedule
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
load_dotenv(ROOT / ".env")

SCHEDULE_TIME = os.getenv("SCHEDULE_TIME", "07:00").strip()


def job() -> None:
    print(f"\n[{datetime.now():%Y-%m-%d %H:%M:%S}] 예약 작업 실행")
    from selenium_blog_post import run_post

    run_post()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true", help="즉시 1회 실행 후 종료")
    args = ap.parse_args()

    if args.once:
        job()
        return 0

    schedule.every().day.at(SCHEDULE_TIME).do(job)
    print(f"스케줄러 시작 — 매일 {SCHEDULE_TIME} 에 블로그 글 업로드")
    print("종료: Ctrl+C")
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    raise SystemExit(main())
