import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "../types";

/** Korea beta — Toss/PortOne 등 연동 전 스텁 */
export const koreaPaymentProvider: PaymentProvider = {
  id: "korea",
  markets: ["KR"],

  isEnabled() {
    return process.env.PAYMENT_KR_ENABLED === "true";
  },

  async createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
    void input;
    return {
      ok: false,
      providerId: "korea",
      message: "한국 결제 연동 준비 중이에요. 곧 이용할 수 있어요.",
    };
  },
};
