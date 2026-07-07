import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "../types";

/**
 * Future international — Stripe etc.
 * Not enabled for Korea beta; implement when expanding globally.
 */
export const stripePaymentProvider: PaymentProvider = {
  id: "stripe",
  markets: ["GLOBAL"],

  isEnabled() {
    return (
      process.env.PAYMENT_STRIPE_ENABLED === "true" &&
      Boolean(process.env.STRIPE_SECRET_KEY)
    );
  },

  async createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
    void input;
    return {
      ok: false,
      providerId: "stripe",
      message: "해외 결제는 아직 지원하지 않아요.",
    };
  },
};
