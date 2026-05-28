/**
 * Compatibility shim — re-exports the Hanzo Commerce client under the legacy
 * `stripeInstance()` and `cancelSubscription()` names so existing call sites
 * compile during the rip-stripe migration.
 *
 * TODO(stripe-rip): rename `stripeInstance` -> `commerce` at every call site
 * and delete this file. Once that is done, also rename the `ee/stripe/`
 * directory to `ee/commerce/`. The actual implementation lives in
 * `lib/commerce.ts`.
 */

import { commerce, type CommerceInstance } from "@/lib/commerce";

export type StripeLike = CommerceInstance;

/** Returns a Commerce client. `account=true` selects the legacy tenant key. */
export const stripeInstance = (account: boolean = false): CommerceInstance => {
  return commerce(account);
};

/** Cancel the customer's first subscription at period end. */
export async function cancelSubscription(
  customer?: string,
  isOldAccount: boolean = false,
) {
  if (!customer) return;
  try {
    const c = commerce(isOldAccount);
    const list = await c.subscriptions.list({ customer });
    const subscriptionId = list.data[0]?.id;
    if (!subscriptionId) return;
    return await c.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: "Customer deleted their dataroom instance.",
      },
    });
  } catch {
    return;
  }
}
