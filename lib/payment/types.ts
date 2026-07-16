import type { Locale, Market } from "@/lib/i18n/config";

export type PremiumPlanId = "monthly" | "yearly";

export interface CheckoutRequest {
  userId: string;
  email?: string | null;
  planId: PremiumPlanId;
  locale: Locale;
  market: Market;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  ok: boolean;
  /** Redirect URL when checkout is live */
  url?: string;
  /** User-facing message when not available (beta) */
  message?: string;
  providerId: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly markets: Market[];
  /** Whether this provider can accept payments in the current environment */
  isEnabled(): boolean;
  createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult>;
}
