/**
 * Web Push helper — VAPID-based browser notifications.
 * Uses dynamic import of `web-push` when available; mocks when keys missing.
 */

export interface WebPushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data: Record<string, string>;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    || process.env.VAPID_PUBLIC_KEY?.trim()
    || null;
}

export function isWebPushConfigured(): boolean {
  const pub = getVapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(pub && priv);
}

export async function sendWebPush(
  subscription: PushSubscriptionKeys,
  payload: WebPushPayload
): Promise<{ success: boolean; expired?: boolean }> {
  if (!isWebPushConfigured()) {
    console.info("[web-push mock]", {
      endpoint: subscription.endpoint.slice(0, 48),
      title: payload.title,
      body: payload.body.slice(0, 80),
    });
    return { success: true };
  }

  try {
    // Optional at runtime when keys missing; package is a normal dependency
    const webpush = await import("web-push").catch(() => null);
    if (!webpush) {
      console.warn("[web-push] package not installed; mock send");
      return { success: true };
    }

    const subject =
      process.env.VAPID_SUBJECT?.trim() || "mailto:support@pickmetalk.com";
    const publicKey = getVapidPublicKey()!;
    const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();

    webpush.setVapidDetails(subject, publicKey, privateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        image: payload.imageUrl,
        data: payload.data,
      }),
      { TTL: 3600, urgency: "high" }
    );
    return { success: true };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 410 || statusCode === 404) {
      return { success: false, expired: true };
    }
    console.error("[web-push] send failed", err);
    return { success: false };
  }
}
