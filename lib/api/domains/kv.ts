import { kv } from "@/lib/kv";

const DOMAIN_REDIRECT_PREFIX = "domain:redirect";

const PLANS_WITH_REDIRECTS = new Set([
  "business",
  "datarooms",
  "datarooms-plus",
  "datarooms-premium",
]);

export function planSupportsRedirects(plan: string): boolean {
  const normalized = plan.replace("+old", "");
  return PLANS_WITH_REDIRECTS.has(normalized);
}

export function getKey(domain: string): string {
  return `${DOMAIN_REDIRECT_PREFIX}:${domain.toLowerCase()}`;
}

export async function getDomainRedirectUrl(
  domain: string,
): Promise<string | null> {
  return kv.get<string>(getKey(domain));
}

export async function setDomainRedirectUrl(
  domain: string,
  redirectUrl: string | null,
): Promise<void> {
  const key = getKey(domain);
  if (redirectUrl) {
    await kv.set(key, redirectUrl);
  } else {
    await kv.del(key);
  }
}

export async function deleteDomainRedirectUrl(domain: string): Promise<void> {
  await kv.del(getKey(domain));
}
