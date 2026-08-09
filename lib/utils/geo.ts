import { Geo } from "../types";

/**
 * Where a request came from, read from OUR edge.
 *
 * Cloudflare fronts every hanzo.ai host, so the client address and location
 * arrive as request headers — no SDK, no platform binding. This used to read
 * `x-vercel-ip-*` and call @vercel/functions, which meant that off Vercel — i.e.
 * in production, on Kubernetes — every view was recorded as 127.0.0.1 in Munich.
 *
 * `cf-connecting-ip` and `cf-ipcountry` are always present. The finer fields
 * (city, region, coordinates, continent) arrive only when Cloudflare's "Add
 * visitor location headers" transform is on for the zone, so each is optional
 * and simply absent otherwise — a missing city must never cost us the country.
 */

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

type HeaderBag = { [key: string]: string | string[] | undefined };

/** Normalise either shape of header container to a plain lookup. */
function bag(headers: HeaderBag | Headers): (name: string) => string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (name) => (headers as Headers).get(name) ?? undefined;
  }
  const h = headers as HeaderBag;
  return (name) => first(h[name]) ?? first(h[name.toLowerCase()]);
}

export function getGeoData(headers: HeaderBag | Headers): Geo {
  const get = bag(headers);
  return {
    city: get("cf-ipcity"),
    region: get("cf-region-code") ?? get("cf-region"),
    country: get("cf-ipcountry"),
    latitude: get("cf-iplatitude"),
    longitude: get("cf-iplongitude"),
  };
}

/** Continent code (EU, NA, …) — a separate header, and separately optional. */
export function getContinent(headers: HeaderBag | Headers): string | undefined {
  return bag(headers)("cf-ipcontinent");
}

/**
 * The client's address.
 *
 * `cf-connecting-ip` is the one Cloudflare sets and a client cannot forge —
 * it is rewritten at the edge. `x-forwarded-for` is only a fallback for
 * requests that did not come through Cloudflare, and only its FIRST entry: the
 * rest are proxies, and anything a client sent is appended, not prepended.
 */
export function getClientIp(headers: HeaderBag | Headers): string | undefined {
  const get = bag(headers);
  const direct = get("cf-connecting-ip") ?? get("x-real-ip");
  if (direct) return direct;
  const forwarded = get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]?.trim() || undefined : undefined;
}

export const LOCALHOST_GEO_DATA = {
  continent: "Europe",
  city: "Munich",
  region: "BY",
  country: "DE",
  latitude: "48.1371",
  longitude: "11.5761",
};

export const LOCALHOST_IP = "127.0.0.1";
