/**
 * Hanzo Commerce REST client and minimal type surface that replaces the
 * Stripe SDK across the dataroom codebase.
 *
 * Talks to commerce.hanzo.ai/api/v1/billing. The hand-rolled client exposes
 * only the surface the dataroom uses (subscriptions, checkout, billing
 * portal, invoices, coupons, customers, and webhook signature verification);
 * the full Hanzo Commerce OpenAPI surface lives at
 * ~/work/hanzo/commerce/api/openapi.yaml.
 *
 * Auth: server-side API key (HANZO_COMMERCE_API_KEY) — org is resolved from
 * the JWT `owner` claim or X-IAM-Org header by commerce itself.
 *
 * Webhook events: commerce emits the same logical event names that Stripe
 * did, so the existing dispatch in pages/api/commerce/webhook.ts keeps the
 * `checkout.session.completed | customer.subscription.{updated,deleted} |
 * invoice.upcoming | payment_intent.payment_failed` taxonomy. Payload shape
 * mirrors Stripe closely; the `CommerceTypes` namespace here is the minimal
 * subset the dataroom touches.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const COMMERCE_URL =
  process.env.HANZO_COMMERCE_URL ?? "https://commerce.hanzo.ai/api/v1/billing";
const COMMERCE_API_KEY = process.env.HANZO_COMMERCE_API_KEY ?? "";
const COMMERCE_API_KEY_OLD = process.env.HANZO_COMMERCE_API_KEY_OLD ?? "";
const COMMERCE_WEBHOOK_SECRET =
  process.env.HANZO_COMMERCE_WEBHOOK_SECRET ?? "";

// ---------------------------------------------------------------------------
// Type surface — mirrors enough of Stripe's shape that the existing dataroom
// call sites compile unchanged. These types intentionally use the legacy
// snake_case field names (current_period_start, amount_paid, ...) so we
// avoid a cascading rename across ~30 server files.
// TODO(stripe-rip): once every caller goes through `commerce()`, flatten to
// camelCase and drop the legacy aliases.
// ---------------------------------------------------------------------------

export namespace CommerceTypes {
  export interface Price {
    id: string;
    product?: string;
    unit_amount?: number | null;
    recurring?: {
      interval?: "month" | "year";
      interval_count?: number;
      usage_type?: "metered" | "licensed";
    } | null;
  }
  export interface SubscriptionItem {
    id: string;
    price: Price;
    quantity?: number | null;
  }
  export interface Coupon {
    id: string;
    percent_off?: number | null;
    amount_off?: number | null;
    duration: "once" | "repeating" | "forever";
    duration_in_months?: number | null;
    valid: boolean;
  }
  export interface Discount {
    coupon: Coupon;
    end?: number | null;
  }
  export interface Subscription {
    id: string;
    customer: string | { id: string };
    status: string;
    items: { data: SubscriptionItem[] };
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    default_payment_method?: string | null;
    discount?: Discount | null;
    pause_collection?: { behavior: string; resumes_at?: number | null } | null;
    metadata?: Record<string, string>;
  }
  export interface Invoice {
    id: string;
    number: string | null;
    status: string | null;
    amount_paid: number;
    currency: string;
    created: number;
    invoice_pdf: string | null;
    hosted_invoice_url: string | null;
    period_start: number;
    period_end: number;
    lines: {
      data: Array<{
        description: string | null;
        price?: Price | null;
      }>;
    };
    customer_email?: string | null;
  }
  export interface Customer {
    id: string;
    email?: string | null;
    name?: string | null;
    metadata?: Record<string, string>;
  }
  export interface CheckoutSession {
    id: string;
    url: string | null;
    customer: string | null;
    customer_email?: string | null;
    client_reference_id: string | null;
    subscription: string | null;
    amount_total?: number | null;
    metadata?: Record<string, string> | null;
  }
  export interface PortalSession {
    id: string;
    url: string;
  }
  export interface Event<T = unknown> {
    id: string;
    type: string;
    created: number;
    data: { object: T; previous_attributes?: Record<string, unknown> };
  }
  export namespace Checkout {
    export type Session = CheckoutSession;
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

class CommerceError extends Error {
  constructor(public readonly status: number, public readonly detail: unknown) {
    super(`commerce ${status}`);
  }
}

async function commerceFetch<T>(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${COMMERCE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new CommerceError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Commerce instance — replaces Stripe SDK surface used by the dataroom.
// Returned object exposes subscriptions/customers/invoices/coupons/checkout/
// billingPortal/webhooks namespaces with the methods the codebase touches.
// ---------------------------------------------------------------------------

export interface CommerceInstance {
  subscriptions: {
    retrieve(id: string, opts?: { expand?: string[] }): Promise<CommerceTypes.Subscription>;
    list(params: { customer: string }): Promise<{ data: CommerceTypes.Subscription[] }>;
    update(
      id: string,
      params: {
        cancel_at_period_end?: boolean;
        cancellation_details?: { comment?: string; feedback?: string };
        discounts?: Array<{ coupon: string }>;
        pause_collection?:
          | { behavior: "void" | "keep_as_draft" | "mark_uncollectible"; resumes_at?: number }
          | ""
          | null;
        items?: Array<{ id?: string; price?: string; quantity?: number; deleted?: boolean }>;
        proration_behavior?: "create_prorations" | "none" | "always_invoice";
        billing_cycle_anchor?: "now" | "unchanged" | number;
        metadata?: Record<string, string>;
      },
    ): Promise<CommerceTypes.Subscription>;
    deleteDiscount(id: string): Promise<void>;
  };
  customers: {
    retrieve(id: string): Promise<CommerceTypes.Customer>;
    update(id: string, params: Partial<CommerceTypes.Customer>): Promise<CommerceTypes.Customer>;
    list(params: { email?: string; limit?: number }): Promise<{ data: CommerceTypes.Customer[] }>;
  };
  invoices: {
    list(params: { customer: string; limit?: number }): Promise<{ data: CommerceTypes.Invoice[] }>;
  };
  coupons: {
    retrieve(id: string): Promise<CommerceTypes.Coupon>;
  };
  checkout: {
    sessions: {
      create(params: Record<string, unknown>): Promise<CommerceTypes.CheckoutSession>;
    };
  };
  billingPortal: {
    sessions: {
      create(params: Record<string, unknown>): Promise<CommerceTypes.PortalSession>;
    };
  };
  webhooks: {
    constructEvent(body: Buffer | string, signature: string | string[] | undefined, secret: string): CommerceTypes.Event;
  };
}

function buildInstance(apiKey: string): CommerceInstance {
  const enc = (s: string) => encodeURIComponent(s);
  return {
    subscriptions: {
      async retrieve(id, opts) {
        const qs = opts?.expand?.length
          ? "?" + opts.expand.map((e) => `expand[]=${enc(e)}`).join("&")
          : "";
        return commerceFetch<CommerceTypes.Subscription>(apiKey, `/subscriptions/${enc(id)}${qs}`);
      },
      async list(params) {
        return commerceFetch<{ data: CommerceTypes.Subscription[] }>(
          apiKey,
          `/subscriptions?customer=${enc(params.customer)}`,
        );
      },
      async update(id, params) {
        return commerceFetch<CommerceTypes.Subscription>(apiKey, `/subscriptions/${enc(id)}`, {
          method: "PATCH",
          body: JSON.stringify(params),
        });
      },
      async deleteDiscount(id) {
        await commerceFetch<void>(apiKey, `/subscriptions/${enc(id)}/discount`, { method: "DELETE" });
      },
    },
    customers: {
      retrieve(id) {
        return commerceFetch<CommerceTypes.Customer>(apiKey, `/customers/${enc(id)}`);
      },
      update(id, params) {
        return commerceFetch<CommerceTypes.Customer>(apiKey, `/customers/${enc(id)}`, {
          method: "PATCH",
          body: JSON.stringify(params),
        });
      },
      list(params) {
        const q = new URLSearchParams();
        if (params.email) q.set("email", params.email);
        if (params.limit) q.set("limit", String(params.limit));
        return commerceFetch<{ data: CommerceTypes.Customer[] }>(apiKey, `/customers?${q.toString()}`);
      },
    },
    invoices: {
      list(params) {
        const q = new URLSearchParams({ customer: params.customer });
        if (params.limit) q.set("limit", String(params.limit));
        return commerceFetch<{ data: CommerceTypes.Invoice[] }>(apiKey, `/invoices?${q.toString()}`);
      },
    },
    coupons: {
      retrieve(id) {
        return commerceFetch<CommerceTypes.Coupon>(apiKey, `/coupons/${enc(id)}`);
      },
    },
    checkout: {
      sessions: {
        create(params) {
          return commerceFetch<CommerceTypes.CheckoutSession>(apiKey, `/checkout/sessions`, {
            method: "POST",
            body: JSON.stringify(params),
          });
        },
      },
    },
    billingPortal: {
      sessions: {
        create(params) {
          return commerceFetch<CommerceTypes.PortalSession>(apiKey, `/billing_portal/sessions`, {
            method: "POST",
            body: JSON.stringify(params),
          });
        },
      },
    },
    webhooks: {
      constructEvent(body, signature, secret) {
        const sig = Array.isArray(signature) ? signature[0] : signature;
        if (!sig) throw new CommerceError(400, "missing signature");
        return verifyWebhookEvent(body, sig, secret);
      },
    },
  };
}

/**
 * Return a Commerce instance. `oldAccount=true` selects the legacy API key
 * (HANZO_COMMERCE_API_KEY_OLD) for tenants migrated from the pre-2024 Stripe
 * account. When the legacy account is fully drained, drop the parameter.
 * TODO(stripe-rip): merge the two key paths once tenants are unified.
 */
export function commerce(oldAccount = false): CommerceInstance {
  return buildInstance(oldAccount ? COMMERCE_API_KEY_OLD || COMMERCE_API_KEY : COMMERCE_API_KEY);
}

// ---------------------------------------------------------------------------
// Webhook signature verification — HMAC-SHA256 over `${timestamp}.${payload}`
// with the configured secret; signature header is `t=<ts>,v1=<sig>`. Same
// shape as the gui migration so we have one and only one verifier.
// ---------------------------------------------------------------------------

function parseSignatureHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(",")) {
    const [k, ...rest] = part.split("=");
    if (k && rest.length > 0) out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

function verifyWebhookEvent(
  payload: Buffer | string,
  signature: string,
  secret: string,
): CommerceTypes.Event {
  if (!secret) throw new CommerceError(500, "commerce webhook secret not configured");
  const raw = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
  const parts = parseSignatureHeader(signature);
  const ts = parts["t"];
  const sig = parts["v1"];
  if (!ts || !sig) throw new CommerceError(400, "invalid signature header");

  const signed = `${ts}.${raw}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new CommerceError(400, "signature mismatch");
  }
  if (Math.floor(Date.now() / 1000) - parseInt(ts, 10) > 300) {
    throw new CommerceError(400, "timestamp out of tolerance");
  }
  return JSON.parse(raw) as CommerceTypes.Event;
}

export { COMMERCE_WEBHOOK_SECRET };
