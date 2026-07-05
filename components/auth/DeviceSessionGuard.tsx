"use client";

import {
  clearDeviceSessionId,
  deviceSessionHeaders,
  ensureDeviceSessionId,
  setDeviceSessionId,
} from "@/lib/auth/deviceSession";
import { clearClientSessionData } from "@/lib/auth/clearClientSession";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PROTECTED_PREFIXES = [
  "/chat",
  "/characters",
  "/conversations",
  "/settings",
  "/gifts",
] as const;

export function DeviceSessionGuard() {
  const pathname = usePathname();
  const [disconnected, setDisconnected] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isProtected) return;

    const sessionId = ensureDeviceSessionId();

    if (!registeredRef.current) {
      registeredRef.current = true;
      void fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...deviceSessionHeaders(),
        },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data: { sessionId?: string }) => {
          if (data.sessionId) setDeviceSessionId(data.sessionId);
        })
        .catch(() => undefined);
    }

    async function validate() {
      try {
        const res = await fetch("/api/session", {
          headers: deviceSessionHeaders(),
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { valid?: boolean };
        if (data.valid === false) {
          setDisconnected(true);
          clearDeviceSessionId();
          clearClientSessionData();
        }
      } catch {
        /* ignore */
      }
    }

    void validate();
    const interval = setInterval(() => void validate(), 20_000);
    const onFocus = () => void validate();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  if (!disconnected) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="text-base font-semibold text-gray-900">접속이 끊어졌어요</p>
        <p className="mt-2 text-sm text-gray-600">
          다른 컴퓨터나 휴대폰에서 접속하여 이 기기의 연결이 종료되었습니다.
        </p>
        <a
          href="/login"
          className="mt-5 inline-block w-full rounded-full bg-pink-accent py-3 text-sm font-semibold text-white"
        >
          다시 로그인
        </a>
      </div>
    </div>
  );
}
