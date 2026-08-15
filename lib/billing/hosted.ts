/**
 * Hanzo hosts payment; the dataroom never takes money itself.
 *
 * - plans and pricing        -> PAY_URL
 * - invoices, payment method -> BILLING_URL
 */

export const PAY_URL = process.env.NEXT_PUBLIC_PAY_URL ?? "https://pay.hanzo.ai";

export const BILLING_URL =
  process.env.NEXT_PUBLIC_BILLING_URL ?? "https://billing.hanzo.ai";

/** Opens a hosted page in a new tab, with no handle back to this one. */
export function visit(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
