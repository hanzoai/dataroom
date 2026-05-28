/**
 * Hanzo Commerce webhook handler.
 *
 * Replaces /api/stripe/webhook. Hanzo Commerce emits the same logical event
 * names as the legacy Stripe webhook (checkout.session.completed,
 * customer.subscription.{updated,deleted}, invoice.upcoming,
 * payment_intent.payment_failed) so the per-event business logic in
 * ee/stripe/webhooks/* continues to apply unchanged.
 *
 * Configure Commerce to POST events here and set
 * HANZO_COMMERCE_WEBHOOK_SECRET to the signing secret from
 * commerce.hanzo.ai admin.
 *
 * TODO(stripe-rip): rename ee/stripe/webhooks/* -> ee/commerce/webhooks/*
 * and update the imports below once the dataroom directory move ships.
 */

import { NextApiRequest, NextApiResponse } from "next";

import { processPaymentFailure } from "@/ee/features/security";
import { stripeInstance } from "@/ee/stripe";
import { checkoutSessionCompleted } from "@/ee/stripe/webhooks/checkout-session-completed";
import { customerSubscriptionDeleted } from "@/ee/stripe/webhooks/customer-subscription-deleted";
import { customerSubsciptionUpdated } from "@/ee/stripe/webhooks/customer-subscription-updated";
import { invoiceUpcoming } from "@/ee/stripe/webhooks/invoice-upcoming";
import { Readable } from "node:stream";

import { COMMERCE_WEBHOOK_SECRET } from "@/lib/commerce";
import { log } from "@/lib/utils";

export const config = {
  supportsResponseStreaming: true,
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "payment_intent.payment_failed",
  "invoice.upcoming",
]);

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const buf = await buffer(req);
  const sig =
    (req.headers["hanzo-commerce-signature"] as string | undefined) ??
    (req.headers["stripe-signature"] as string | undefined);

  if (!sig || !COMMERCE_WEBHOOK_SECRET) {
    return res.status(400).send("Missing signature or secret");
  }

  let event;
  try {
    const c = stripeInstance();
    event = c.webhooks.constructEvent(buf, sig, COMMERCE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!relevantEvents.has(event.type)) {
    return res.status(400).send(`Unhandled event type: ${event.type}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await checkoutSessionCompleted(event);
        break;
      case "customer.subscription.updated":
        await customerSubsciptionUpdated(event, res);
        break;
      case "customer.subscription.deleted":
        await customerSubscriptionDeleted(event, res);
        break;
      case "payment_intent.payment_failed":
        await processPaymentFailure(event);
        break;
      case "invoice.upcoming":
        await invoiceUpcoming(event, res);
        break;
    }
  } catch (error) {
    await log({
      message: `Commerce webhook failed. Error: ${error}`,
      type: "error",
    });
    return res
      .status(400)
      .send("Webhook error: Webhook handler failed. View logs.");
  }

  return res.status(200).json({ received: true });
}
