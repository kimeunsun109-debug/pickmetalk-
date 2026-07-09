import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function setPremiumForUser(
  userId: string,
  active: boolean,
  extra?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionStatus?: string;
  }
) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    is_premium: active,
    subscription_status:
      extra?.subscriptionStatus ?? (active ? "active" : "canceled"),
  };
  if (extra?.stripeCustomerId) {
    patch.stripe_customer_id = extra.stripeCustomerId;
  }
  if (extra?.stripeSubscriptionId !== undefined) {
    patch.stripe_subscription_id = extra.stripeSubscriptionId;
  }
  if (active) {
    patch.premium_started_at = now;
  }
  await admin.from("profiles").update(patch).eq("id", userId);
}

function resolveUserId(
  session: Stripe.Checkout.Session | Stripe.Subscription
): string | null {
  const meta = session.metadata?.userId;
  if (meta) return meta;
  if ("client_reference_id" in session && session.client_reference_id) {
    return session.client_reference_id;
  }
  return null;
}

/**
 * POST /api/stripe/webhook — Stripe → profiles.is_premium
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = resolveUserId(session);
        if (!userId) break;
        await setPremiumForUser(userId, true, {
          stripeCustomerId: session.customer as string | null,
          stripeSubscriptionId: session.subscription as string | null,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = resolveUserId(sub);
        if (!userId) break;
        const keepPremium =
          sub.status === "active" ||
          sub.status === "trialing" ||
          sub.status === "past_due";
        const subscriptionStatus =
          sub.status === "past_due"
            ? "past_due"
            : keepPremium
              ? "active"
              : "canceled";
        await setPremiumForUser(userId, keepPremium, {
          stripeCustomerId: sub.customer as string | null,
          stripeSubscriptionId: sub.id,
          subscriptionStatus,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = resolveUserId(sub);
        if (!userId) break;
        await setPremiumForUser(userId, false, {
          stripeCustomerId: sub.customer as string | null,
          stripeSubscriptionId: null,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
