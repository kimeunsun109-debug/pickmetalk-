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
      return;
    }
    void fetch("/api/push/vapid-public-key")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => {
        if (!j.configured) {
          setStatus("unsupported");
          setMessage("알림 키가 아직 설정되지 않았어요.");
        } else {
          setStatus(
            Notification.permission === "granted" ? "ready" : "ready"
          );
        }
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  const enable = useCallback(async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey, configured } = (await keyRes.json()) as {
        publicKey: string | null;
        configured: boolean;
      };
      if (!configured || !publicKey) {
        setStatus("unsupported");
        setMessage("알림 키가 아직 설정되지 않았어요.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMessage("알림 권한이 거부되었어요.");
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
      setMessage("알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, []);

  if (status === "unsupported") {
    return (
      <p className="text-xs text-gray-500">
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
      {message ? <p className="text-xs text-gray-500">{message}</p> : null}
    </div>
  );
}
