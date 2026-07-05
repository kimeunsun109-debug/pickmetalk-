import { isPremiumPlanConfigured, PREMIUM_PLANS } from "@/lib/stripe/plans";
import { NextResponse } from "next/server";

/** GET /api/stripe/plans — configured premium plan IDs for checkout UI */
export async function GET() {
  const plans = PREMIUM_PLANS.filter((plan) =>
    isPremiumPlanConfigured(plan.id)
  ).map((plan) => plan.id);

  return NextResponse.json({ plans });
}
