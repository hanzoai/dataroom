/**
 * Compatibility shim — drops Stripe.js Elements in favour of redirecting the
 * browser to Hanzo Pay (pay.hanzo.ai). Hanzo Pay is the @hanzoai/pay React
 * SPA that terminates the actual payment with Hanzo Commerce; we never load
 * card UI inside the dataroom anymore.
 *
 * Returned shape mirrors the subset of `Stripe` the codebase touches:
 * `redirectToCheckout({ sessionId })`. The Commerce checkout-session URL is
 * returned by the server-side upgrade endpoint as `url`; when only the id is
 * available, we build `pay.hanzo.ai/checkout?session=<id>` directly.
 *
 * TODO(stripe-rip): once every caller passes the full `url` from the
 * upgrade endpoint, delete this file and call `window.location.assign(url)`
 * inline.
 */

const PAY_URL = process.env.NEXT_PUBLIC_HANZO_PAY_URL ?? "https://pay.hanzo.ai";

interface CommercePay {
  redirectToCheckout(params: { sessionId?: string; url?: string }): Promise<void>;
}

export const getStripe = async (_account: boolean = false): Promise<CommercePay> => {
  return {
    async redirectToCheckout(params: { sessionId?: string; url?: string }) {
      if (params.url) {
        window.location.assign(params.url);
        return;
      }
      if (params.sessionId) {
        window.location.assign(
          `${PAY_URL}/checkout?session=${encodeURIComponent(params.sessionId)}`,
        );
        return;
      }
      throw new Error("commerce checkout: missing sessionId or url");
    },
  };
};
