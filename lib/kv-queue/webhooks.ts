import { kv } from "@/lib/kv";

/**
 * Outbound webhook delivery, queued in Hanzo KV.
 *
 * This replaces QStash, which this fork had already stubbed to a no-op — every
 * `publishJSON` logged a warning, returned `{ messageId: "noop" }` and DROPPED
 * the event. Customers' webhooks have not fired since.
 *
 * A KV list is the queue: `rpush` to enqueue, `lpop` to take. Delivery is a
 * plain POST — the signature the receiver checks is computed at enqueue time and
 * carried with the item, so a retry re-sends the same bytes with the same
 * signature rather than re-signing a payload that may have changed shape.
 *
 * Nothing here fires on a timer. `drain()` is called by /api/cron/webhooks, so
 * an unscheduled queue accumulates durably (with a TTL) instead of vanishing —
 * which is already the difference between this and the no-op it replaces.
 */

const QUEUE_KEY = "webhooks:pending";
const QUEUE_TTL_SECONDS = 7 * 24 * 60 * 60; // a week to notice and drain
const MAX_ATTEMPTS = 5;

export type WebhookDelivery = {
  webhookId: string;
  url: string;
  /** The exact JSON string that was signed. Re-signing on retry would break it. */
  body: string;
  signature: string;
  eventId: string;
  event: string;
  attempts: number;
  queuedAt: number;
};

/** Enqueue one delivery. Never throws — a KV outage must not fail the caller's write. */
export async function enqueue(
  delivery: Omit<WebhookDelivery, "attempts" | "queuedAt">,
): Promise<boolean> {
  try {
    const item: WebhookDelivery = { ...delivery, attempts: 0, queuedAt: Date.now() };
    const pipeline = kv.pipeline();
    pipeline.rpush(QUEUE_KEY, JSON.stringify(item));
    pipeline.expire(QUEUE_KEY, QUEUE_TTL_SECONDS);
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error("[webhooks] could not queue delivery", error);
    return false;
  }
}

/** How many deliveries are waiting. */
export async function pending(): Promise<number> {
  try {
    return await kv.llen(QUEUE_KEY);
  } catch {
    return 0;
  }
}

/**
 * Take up to `limit` deliveries and POST them.
 *
 * A failure goes BACK on the queue with its attempt count raised, until
 * MAX_ATTEMPTS — so a customer endpoint that is briefly down does not lose the
 * event, and one that is permanently gone does not spin forever.
 */
export async function drain(limit = 50): Promise<{
  sent: number;
  failed: number;
  dropped: number;
}> {
  let sent = 0;
  let failed = 0;
  let dropped = 0;

  for (let i = 0; i < limit; i++) {
    const raw = await kv.lpop(QUEUE_KEY);
    if (!raw) break;

    let item: WebhookDelivery;
    try {
      item = typeof raw === "string" ? JSON.parse(raw) : (raw as WebhookDelivery);
    } catch {
      dropped++; // unparseable: dropping it is the only way to make progress
      continue;
    }

    try {
      const res = await fetch(item.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hanzo-Dataroom-Signature": item.signature,
        },
        body: item.body,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sent++;
    } catch (error) {
      const attempts = item.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        dropped++;
        console.error(
          `[webhooks] giving up on ${item.webhookId} after ${attempts} attempts`,
          error,
        );
      } else {
        failed++;
        await kv.rpush(QUEUE_KEY, JSON.stringify({ ...item, attempts }));
      }
    }
  }

  return { sent, failed, dropped };
}
