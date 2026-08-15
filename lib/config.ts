import { kv } from "@/lib/kv";

/**
 * Operational config — the lists and flags that change without a deploy.
 *
 * This replaces @vercel/edge-config, which in production read nothing: EDGE_CONFIG
 * is unset on this deployment, so every `get()` threw and each call site caught it
 * and fell back to an empty default. That is why no team was ever trusted, no beta
 * feature was ever on, and the email/keyword blacklist matched nothing — abuse
 * filtering has been silently off.
 *
 * Hanzo KV is the store, under a `config:` prefix, so a value is changed with a
 * KV write instead of a deploy — which is the whole reason the app reached for an
 * edge config service.
 *
 * Reads never throw. A KV outage returns the fallback, exactly as the old callers
 * assumed, so a config lookup can never take down a request path.
 */

export type ConfigKey =
  | "betaFeatures"
  | "customEmail"
  | "emails"
  | "keywords"
  | "trustedTeams";

export async function getConfig<T>(key: ConfigKey, fallback: T): Promise<T> {
  try {
    const value = await kv.get<T>(`config:${key}`);
    return value ?? fallback;
  } catch (error) {
    console.error(`[config] could not read ${key}`, error);
    return fallback;
  }
}

/** A list of strings, with anything else in the value discarded. */
export async function getStringList(key: ConfigKey): Promise<string[]> {
  const value = await getConfig<unknown>(key, []);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
