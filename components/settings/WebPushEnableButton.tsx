"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function WebPushEnableButton() {
  const [status, setStatus] = useState<
    "idle" | "unsupported" | "ready" | "subscribed" | "error" | "loading"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      setMessage("이 브라우저나 앱 환경에서는 사진 알림을 사용할 수 없어요.");
      return;
    }
    void (async () => {
      if (Notification.permission === "denied") {
        setStatus("error");
        setMessage("알림 권한이 차단되어 있어요. 브라우저 설정에서 픽미톡 알림을 허용해 주세요.");
        return;
      }

      try {
        const keyRes = await fetch("/api/push/vapid-public-key");
        if (!keyRes.ok) throw new Error("키 정보를 확인하지 못했어요.");
        const j = (await keyRes.json()) as { configured?: boolean };
        if (!j.configured) {
          setStatus("unsupported");
          setMessage("사진 알림 기능을 준비 중이에요. 현재는 인앱 알림만 사용할 수 있어요.");
          return;
        }

        const reg = await navigator.serviceWorker.getRegistration();
        const existingSubscription = await reg?.pushManager.getSubscription();
        setStatus(existingSubscription ? "subscribed" : "ready");
        setMessage(existingSubscription ? "사진 알림이 켜져 있어요." : null);
      } catch (e) {
        console.error(e);
        setStatus("error");
        setMessage("알림 설정 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    })();
  }, []);

  const enable = useCallback(async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) throw new Error("키 정보를 확인하지 못했어요.");
      const { publicKey, configured } = (await keyRes.json()) as {
        publicKey: string | null;
        configured: boolean;
      };
      if (!configured || !publicKey) {
        setStatus("unsupported");
        setMessage("사진 알림 기능을 준비 중이에요. 현재는 인앱 알림만 사용할 수 있어요.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMessage("알림 권한이 차단되어 있어요. 브라우저 설정에서 픽미톡 알림을 허용해 주세요.");
        return;
      }

      // Prefer existing PWA SW when enabled; otherwise register a minimal push SW later.
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/web-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("구독 저장 실패");

      setStatus("subscribed");
      setMessage("사진 알림이 켜졌어요.");
    } catch (e) {
      console.error(e);
      setStatus("error");
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setMessage("알림 권한이 차단되어 있어요. 브라우저 설정에서 픽미톡 알림을 허용해 주세요.");
      } else if (e instanceof DOMException && e.name === "SecurityError") {
        setMessage("보안 연결(HTTPS) 또는 브라우저 설정을 확인해 주세요.");
      } else if (e instanceof Error && e.message === "구독 저장 실패") {
        setMessage("알림 구독은 만들었지만 서버 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      } else {
        setMessage("브라우저에서 알림 구독을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    }
  }, []);

  if (status === "unsupported") {
    return (
      <p className="text-xs leading-relaxed text-gray-500" role="status" aria-live="polite">
        {message ?? "이 환경에서는 브라우저 알림을 사용할 수 없어요."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void enable()}
        disabled={status === "loading" || status === "subscribed"}
        className="w-full rounded-xl border border-pink-200 bg-pink-50 py-2.5 text-sm font-medium text-pink-700 active:bg-pink-100 disabled:opacity-60"
      >
        {status === "subscribed"
          ? "알림 켜짐"
          : status === "loading"
            ? "설정 중…"
            : "사진 알림 켜기"}
      </button>
      {message ? (
        <p
          className={
            status === "error"
              ? "text-xs leading-relaxed text-red-600"
              : "text-xs leading-relaxed text-gray-500"
          }
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
