"""
네이버 블로그 이웃글 댓글 작성 모듈

구조:
  CommentContext  — 글 URL에서 blogId/logNo 추출
  CommentResult   — 성공/실패 + 사용한 전략 기록
  CommentWriter   — 다중 전략 순차 시도

전략 우선순위:
  1. mobile_cbox  — m.blog.naver.com/CommentList (가장 안정)
  2. desktop_js   — mainFrame naverCommentController
  3. desktop_cbox — mainFrame cbox iframe (레거시)
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Literal

from playwright.sync_api import FrameLocator, Page

StrategyName = Literal["mobile_cbox", "desktop_js", "desktop_cbox", "none"]

LOG_PATH: Path | None = None


@dataclass
class CommentContext:
    post_url: str
    blog_id: str = ""
    log_no: str = ""
    title: str = ""

    @classmethod
    def from_url(cls, post_url: str, title: str = "") -> CommentContext | None:
        blog_id, log_no = parse_post_url(post_url)
        if not blog_id or not log_no:
            return None
        return cls(post_url=post_url, blog_id=blog_id, log_no=log_no, title=title)


@dataclass
class CommentResult:
    ok: bool
    strategy: StrategyName = "none"
    message: str = ""
    error: str = ""

    def __bool__(self) -> bool:
        return self.ok


def parse_post_url(url: str) -> tuple[str, str]:
    m = re.search(r"blog\.naver\.com/([^/?#]+)/(\d+)", url)
    if m:
        return m.group(1), m.group(2)
    m = re.search(r"[?&]blogId=([^&]+).*[&?]logNo=(\d+)", url)
    if m:
        return m.group(1), m.group(2)
    m = re.search(r"[?&]logNo=(\d+).*?[&?]blogId=([^&]+)", url)
    if m:
        return m.group(2), m.group(1)
    return "", ""


def mobile_comment_url(blog_id: str, log_no: str) -> str:
    return f"https://m.blog.naver.com/CommentList.naver?blogId={blog_id}&logNo={log_no}"


def _log_comment(entry: dict) -> None:
    if LOG_PATH is None:
        return
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry.setdefault("ts", datetime.now().isoformat(timespec="seconds"))
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _main_frame(page: Page) -> FrameLocator:
    page.wait_for_selector("iframe#mainFrame", timeout=15000)
    return page.frame_locator("iframe#mainFrame")


class CommentWriter:
    def __init__(self, page: Page, *, log_path: Path | None = None):
        self.page = page
        global LOG_PATH
        if log_path:
            LOG_PATH = log_path

    def write(self, post_url: str, text: str, *, title: str = "") -> CommentResult:
        ctx = CommentContext.from_url(post_url, title)
        if not ctx:
            return CommentResult(ok=False, error="URL 파싱 실패")

        strategies: list[tuple[StrategyName, callable]] = [
            ("mobile_cbox", lambda: self._via_mobile(ctx, text)),
            ("desktop_js", lambda: self._via_desktop_controller(ctx, text)),
            ("desktop_cbox", lambda: self._via_desktop_cbox(ctx, text)),
        ]
        last_err = ""
        for name, fn in strategies:
            try:
                if fn():
                    result = CommentResult(ok=True, strategy=name, message=text[:80])
                    self._record(ctx, text, result)
                    return result
            except Exception as e:
                last_err = str(e)[:120]
                continue

        result = CommentResult(ok=False, strategy="none", error=last_err or "모든 전략 실패")
        self._record(ctx, text, result)
        return result

    def _record(self, ctx: CommentContext, text: str, result: CommentResult) -> None:
        _log_comment({
            "date": date.today().isoformat(),
            "blog_id": ctx.blog_id,
            "log_no": ctx.log_no,
            "post_url": ctx.post_url,
            "title": ctx.title,
            "comment": text if result.ok else "",
            "strategy": result.strategy,
            "ok": result.ok,
            "error": result.error,
        })

    def _via_mobile(self, ctx: CommentContext, text: str) -> bool:
        url = mobile_comment_url(ctx.blog_id, ctx.log_no)
        self.page.goto(url, wait_until="domcontentloaded", timeout=25000)
        self.page.wait_for_timeout(2000)
        done = self.page.evaluate(
            """(msg) => {
            const el = document.querySelector(
              '#naverComment__write_textarea, .u_cbox_text[contenteditable="true"]'
            );
            if (!el) return false;
            el.focus();
            el.textContent = msg;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('keyup', { bubbles: true }));
            const btn = document.querySelector('.u_cbox_btn_upload, button.u_cbox_btn_upload');
            if (!btn || btn.disabled) return false;
            btn.click();
            return true;
        }""",
            text,
        )
        if not done:
            return False
        self.page.wait_for_timeout(1500)
        return True

    def _via_desktop_controller(self, ctx: CommentContext, text: str) -> bool:
        self.page.goto(ctx.post_url, wait_until="domcontentloaded", timeout=25000)
        self.page.wait_for_timeout(3000)
        fl = _main_frame(self.page)
        fl.locator("body").evaluate("window.scrollTo(0, document.body.scrollHeight)")
        self.page.wait_for_timeout(800)
        return fl.locator("body").evaluate(
            """(msg) => {
            const btn = document.querySelector('a._naverCommentWriteBtn');
            if (btn && window.jQuery) window.jQuery(btn).trigger('click');
            else if (btn) btn.click();
            const el = document.querySelector(
              '#naverComment__write_textarea, .u_cbox_text[contenteditable="true"], textarea.u_cbox_text'
            );
            if (!el) return false;
            el.focus();
            if (el.tagName === 'TEXTAREA') el.value = msg;
            else el.textContent = msg;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const upload = document.querySelector('.u_cbox_btn_upload, button.u_cbox_btn_upload');
            if (upload) { upload.click(); return true; }
            return false;
        }""",
            text,
        )

    def _via_desktop_cbox(self, ctx: CommentContext, text: str) -> bool:
        if self.page.url != ctx.post_url:
            self.page.goto(ctx.post_url, wait_until="domcontentloaded", timeout=25000)
            self.page.wait_for_timeout(3000)
        fl = _main_frame(self.page)
        fl.locator("body").evaluate("""() => {
          window.scrollTo(0, document.body.scrollHeight);
          document.querySelector('a.btn_write_comment, a._naverCommentWriteBtn')?.click();
        }""")
        for _ in range(10):
            self.page.wait_for_timeout(1000)
            for fr in self.page.frames:
                if "cbox" not in fr.url.lower():
                    continue
                try:
                    ok = fr.evaluate(
                        """(msg) => {
                        const el = document.querySelector(
                          '[contenteditable=true].u_cbox_text, textarea.u_cbox_text, textarea'
                        );
                        if (!el) return false;
                        el.focus();
                        if (el.tagName === 'TEXTAREA') el.value = msg;
                        else el.textContent = msg;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        const btn = document.querySelector('.u_cbox_btn_upload')
                          || [...document.querySelectorAll('button,a')].find(
                            b => (b.innerText || '').trim() === '등록'
                          );
                        if (btn) { btn.click(); return true; }
                        return false;
                    }""",
                        text,
                    )
                    if ok:
                        self.page.wait_for_timeout(1200)
                        return True
                except Exception:
                    continue
        return False


def write_neighbor_comment(
    page: Page, post_url: str, text: str, *, title: str = "", log_path: Path | None = None
) -> bool:
    writer = CommentWriter(page, log_path=log_path)
    return bool(writer.write(post_url, text, title=title))
