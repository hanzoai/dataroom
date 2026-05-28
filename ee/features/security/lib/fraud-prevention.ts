import { NextApiResponse } from "next";

import { get } from "@vercel/edge-config";

import type { CommerceTypes } from "@/lib/commerce";
import { log } from "@/lib/utils";

// CommerceTypes.PaymentIntent does not yet exist; payment-failure events
// carry the same shape via Commerce, so we declare the minimal subset we
// need locally. TODO(stripe-rip): promote into CommerceTypes once the
// Commerce webhook schema for payment-intent failures is finalised.
interface PaymentIntentLike {
  receipt_email: string | null;
  last_payment_error?: { decline_code?: string } | null;
}

/**
 * High-risk decline codes that indicate potential fraud
 */
const FRAUD_DECLINE_CODES = [
  "fraudulent",
  "stolen_card",
  "pickup_card",
  "restricted_card",
  "security_violation",
];

/**
 * Add email to the fraud blocklist.
 *
 * TODO(stripe-rip): the legacy implementation called Stripe Radar's value
 * lists API. Hanzo Commerce handles fraud signals at the gateway layer and
 * does not expose a Radar-equivalent endpoint yet. Until the Commerce
 * fraud-blocklist API ships, the Edge Config blocklist below remains the
 * effective blocking surface; this function is a no-op so the caller's
 * Promise.allSettled keeps its arity stable.
 */
export async function addEmailToStripeRadar(email: string): Promise<boolean> {
  log({
    message: `(commerce migration) skipping Radar blocklist add for ${email}; rely on Edge Config blocklist`,
    type: "info",
  });
  return false;
}

/**
 * Add email to Vercel Edge Config blocklist
 */
export async function addEmailToEdgeConfig(email: string): Promise<boolean> {
  try {
    // 1. Read current emails from Edge Config
    const currentEmails = (await get("emails")) || [];

    // Check if email already exists
    if (Array.isArray(currentEmails) && currentEmails.includes(email)) {
      log({
        message: `Email ${email} already in Edge Config blocklist`,
        type: "info",
      });
      return true;
    }

    // 2. Add new email
    const updatedEmails = Array.isArray(currentEmails)
      ? [...currentEmails, email]
      : [email];

    // 3. Update via Vercel REST API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AUTH_BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "update",
              key: "emails",
              value: updatedEmails,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    log({
      message: `Added email ${email} to Edge Config blocklist`,
      type: "info",
    });
    return true;
  } catch (error) {
    log({
      message: `Failed to add email to Edge Config: ${error}`,
      type: "error",
    });
    return false;
  }
}

/**
 * Process Stripe payment failure for fraud indicators
 */
export async function processPaymentFailure(
  event: CommerceTypes.Event,
): Promise<void> {
  const paymentFailure = event.data.object as PaymentIntentLike;
  const email = paymentFailure.receipt_email;
  const declineCode = paymentFailure.last_payment_error?.decline_code;

  if (!email || !declineCode) {
    return;
  }

  // Check if decline code indicates fraud
  if (FRAUD_DECLINE_CODES.includes(declineCode)) {
    log({
      message: `Fraud indicator detected: ${declineCode} for email: ${email}`,
      type: "info",
    });

    // Add to Edge Config blocklist (Radar add is a no-op during the
    // stripe-rip migration; see addEmailToStripeRadar above).
    const [, edgeConfigResult] = await Promise.allSettled([
      addEmailToStripeRadar(email),
      addEmailToEdgeConfig(email),
    ]);

    if (edgeConfigResult.status === "fulfilled" && edgeConfigResult.value) {
      log({
        message: `Successfully added ${email} to Edge Config`,
        type: "info",
      });
    } else {
      log({
        message: `Failed to add ${email} to Edge Config:`,
        type: "error",
      });
    }
  }
}
