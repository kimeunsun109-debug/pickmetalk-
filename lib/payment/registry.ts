import { defaultMarket, type Locale, type Market } from "@/lib/i18n/config";
import { koreaPaymentProvider } from "./providers/korea-stub";
import { stripePaymentProvider } from "./providers/stripe-stub";
import type { PaymentProvider } from "./types";

const providers: PaymentProvider[] = [
  koreaPaymentProvider,
  stripePaymentProvider,
];

export function resolveMarket(locale: Locale = "ko"): Market {
  void locale;
  return defaultMarket;
}

export function getPaymentProvider(market: Market = defaultMarket): PaymentProvider {
  if (market === "KR") return koreaPaymentProvider;
  return stripePaymentProvider;
}

export function listPaymentProviders(): PaymentProvider[] {
  return providers;
}
