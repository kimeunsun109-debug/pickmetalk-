import { createClient } from "@/lib/supabase/server";
import {
  getPaymentProvider,
  resolveMarket,
  type PremiumPlanId,
} from "@/lib/payment";
import { defaultLocale, t } from "@/lib/i18n";
import { NextResponse } from "next/server";

/**
 * POST /api/premium/checkout
 * Payment interface only — actual KR provider wired later.
 * Body: { planId?: "monthly" | "yearly", locale?: "ko" }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let planId: PremiumPlanId = "monthly";
  let locale = defaultLocale;
  try {
    const body = (await request.json()) as {
      planId?: PremiumPlanId;
      locale?: string;
    };
    if (body.planId === "yearly" || body.planId === "monthly") {
      planId = body.planId;
    }
    if (body.locale === "ko") locale = body.locale;
  } catch {
    /* defaults */
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const market = resolveMarket(locale);
  const provider = getPaymentProvider(market);
  const result = await provider.createCheckoutSession({
    userId: user.id,
    email: user.email,
    planId,
    locale,
    market,
    successUrl: `${appUrl}/settings?premium=success`,
    cancelUrl: `${appUrl}/chat?premium=cancel`,
  });

  if (!result.ok || !result.url) {
    return NextResponse.json(
      {
        ok: false,
        providerId: result.providerId,
        message:
          result.message ?? t("premium.paymentUnavailable", locale),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, url: result.url, providerId: result.providerId });
}
