"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "pickme_pwa_install_dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setVisible(true);
    };

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
    } else {
      window.addEventListener("beforeinstallprompt", onBeforeInstall);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-pink-200/80 bg-[#fff8f0]/95 px-4 py-3 backdrop-blur-md safe-bottom"
    >
      <div className="mx-auto flex max-w-md items-start gap-3">
        <div className="flex-1 text-sm leading-relaxed text-[#3d342f]">
          {iosHint ? (
            <>
              <p className="font-semibold">앱처럼 쓰기</p>
              <p className="mt-1 text-[#6b5f58]">
                Safari <strong>공유</strong> → <strong>홈 화면에 추가</strong>
                하면 PC에서 하던 대화를 바로 이어갈 수 있어요.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">픽미톡 설치</p>
              <p className="mt-1 text-[#6b5f58]">
                홈 화면에 추가하면 PC·폰에서 같은 대화를 이어갈 수 있어요.
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-[#6b5f58]"
          aria-label="닫기"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
