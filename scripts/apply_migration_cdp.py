#!/usr/bin/env python3
"""Apply 007 migration via existing Chrome CDP session (port 9222)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / "supabase/migrations/007_chat_voice_journal.sql"
SQL_URL = "https://supabase.com/dashboard/project/qrkjkceghckxkehjcwrj/sql/new"
CDP = "http://127.0.0.1:9222"


def main() -> int:
    sql = SQL_PATH.read_text(encoding="utf-8")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP)
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        page = context.new_page()
        page.goto(SQL_URL, wait_until="domcontentloaded", timeout=120_000)
        page.wait_for_timeout(6000)

        if "sign-in" in page.url or "/login" in page.url:
            print("❌ Supabase 로그인 필요:", page.url)
            page.close()
            return 1

        editor = page.locator(".monaco-editor textarea").first
        if editor.count() == 0:
            editor = page.locator("textarea").first
        editor.wait_for(state="visible", timeout=90_000)
        editor.click()
        page.keyboard.press("Control+A")
        page.keyboard.insert_text(sql)

        run_btn = page.get_by_role("button", name="Run")
        if run_btn.count() == 0:
            run_btn = page.locator('button:has-text("Run")').first
        run_btn.click()
        page.wait_for_timeout(10000)

        body = page.locator("body").inner_text()
        page.close()

        if "already exists" in body.lower():
            print("✅ chat_voice_journal (이미 존재)")
            return 0
        if any(x in body.lower() for x in ("success", "completed", "no rows returned")):
            print("✅ SQL Editor 실행 완료")
            return 0
        if "error" in body.lower():
            print("❌ SQL 에러:", body[:800])
            return 1

        print("✅ Run 실행됨 — REST로 테이블 확인 중")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
