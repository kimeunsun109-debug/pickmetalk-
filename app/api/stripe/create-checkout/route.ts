import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  isPremiumPlanConfigured,
  resolveStripePriceId,
  type PremiumPlanId,
} from "@/lib/stripe/plans";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/stripe/create-checkout
 * Body: { plan: "monthly" | "yearly" }
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "결제가 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  let plan: PremiumPlanId = "monthly";
  try {
    const body = (await request.json()) as { plan?: string };
    if (body.plan === "yearly" || body.plan === "monthly") {
      plan = body.plan;
    }
  } catch {
    /* default monthly */
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isPremiumPlanConfigured(plan)) {
    return NextResponse.json(
      { error: "선택한 요금제가 아직 준비되지 않았어요." },
      { status: 503 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, stripe_customer_id, is_premium")
    .eq("id", user.id)
    .maybeSingle();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const stripe = getStripe();
  const priceId = resolveStripePriceId(plan);

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?premium=success`,
    cancel_url: `${appUrl}/chat?premium=cancel`,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan,
      },
    },
  };

  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id;
  } else if (user.email) {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: session.url });
}
