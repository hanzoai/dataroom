import { Webhook } from "@prisma/client";

import { enqueue } from "@/lib/kv-queue/webhooks";

import { createWebhookSignature } from "./signature";
import { prepareWebhookPayload } from "./transform";
import { EventDataProps, WebhookPayload, WebhookTrigger } from "./types";

// Send webhooks to multiple webhooks
export const sendWebhooks = async ({
  webhooks,
  trigger,
  data,
}: {
  webhooks: Pick<Webhook, "pId" | "url" | "secret">[];
  trigger: WebhookTrigger;
  data: EventDataProps;
}) => {
  if (webhooks.length === 0) {
    return;
  }

  const payload = prepareWebhookPayload(trigger, data);

  return await Promise.all(
    webhooks.map((webhook) =>
      queueWebhookEvent({ webhook, payload }),
    ),
  );
};

// Queue a webhook event for delivery (Hanzo KV).
//
// Was QStash, which this fork stubbed to a no-op — the event was signed, handed
// to `publishJSON`, logged as a warning and thrown away. The signature is still
// computed here, and now travels with the item so a retry re-sends identical
// bytes instead of re-signing.
const queueWebhookEvent = async ({
  webhook,
  payload,
}: {
  webhook: Pick<Webhook, "pId" | "url" | "secret">;
  payload: WebhookPayload;
}) => {
  const body = JSON.stringify(payload);
  const signature = await createWebhookSignature(webhook.secret, payload);

  const queued = await enqueue({
    webhookId: webhook.pId,
    url: webhook.url,
    body,
    signature,
    eventId: payload.id,
    event: payload.event,
  });

  if (!queued) {
    console.error("[webhooks] delivery not queued", {
      webhookId: webhook.pId,
      event: payload.event,
    });
  }

  return { queued };
};
