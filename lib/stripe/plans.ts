export type PremiumPlanId = "monthly" | "yearly";

export interface PremiumPlanConfig {
  id: PremiumPlanId;
  labelKey: string;
  priceLabel: string;
  stripePriceEnv: "STRIPE_PRICE_MONTHLY_ID" | "STRIPE_PRICE_YEARLY_ID";
}

export const PREMIUM_PLANS: PremiumPlanConfig[] = [
  {
    id: "monthly",
    labelKey: "premium.plans.monthly",
    priceLabel: "₩9,900 / 월",
    stripePriceEnv: "STRIPE_PRICE_MONTHLY_ID",
  },
  {
    id: "yearly",
    labelKey: "premium.plans.yearly",
    priceLabel: "₩79,000 / 년",
    stripePriceEnv: "STRIPE_PRICE_YEARLY_ID",
  },
];

export function resolveStripePriceId(plan: PremiumPlanId): string {
  const envKey =
    plan === "monthly" ? "STRIPE_PRICE_MONTHLY_ID" : "STRIPE_PRICE_YEARLY_ID";
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}

/** Beta: one clear pay reason — unlimited daily chat. */
export const PREMIUM_VALUE_PROPOSITION = {
  headline: "오늘 무료 대화를 모두 사용했어요.",
  primaryBenefit: "무제한 대화",
  futureBenefits: ["장기 기억", "전화", "사진", "음성"],
} as const;
