import { NextApiRequest, NextApiResponse } from "next";

/**
 * Cancellation-flow stubs.
 *
 * The commercial subscription pause/cancel/reactivate flow was removed when
 * the AGPL fork dropped the paywall. These stubs preserve compile-time
 * signatures so existing route files continue to type-check; at runtime they
 * report that the feature is gone.
 */

export async function handleRoute(_req: NextApiRequest, res: NextApiResponse) {
  return res
    .status(410)
    .json({ error: "Subscription management is not enabled on this instance." });
}

// Trigger.dev task stubs: they expose a `.trigger()` no-op so call sites that
// fire-and-forget the original tasks still work.
const noopTask = {
  trigger: async () => undefined,
  triggerAndWait: async () => undefined,
  batchTrigger: async () => undefined,
};

export const automaticUnpauseTask = noopTask;
export const sendPauseResumeNotificationTask = noopTask;
