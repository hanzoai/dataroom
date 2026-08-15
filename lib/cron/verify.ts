/**
 * Guard for the internal cron endpoints.
 *
 * What this replaces: an Upstash-Signature check that could not run. It sat
 * behind `if (process.env.VERCEL === "1")`, and this app runs on Kubernetes —
 * so the branch was always false and every /api/cron/* route was reachable by
 * anyone who knew the path. The signature verifier behind it was a stub that
 * returned `true` unconditionally, so even on Vercel it asserted nothing.
 *
 * This is a shared secret between the scheduler and these routes — not an
 * identity, and deliberately not a second auth system. Anything user-facing
 * goes through Hanzo IAM.
 *
 * It FAILS CLOSED: no CRON_SECRET configured means no cron may run. That is the
 * safe direction — nothing schedules these today, so a missing secret costs
 * nothing, while the old behaviour left them open to the internet.
 */
export function verifyCron(req: Request): { ok: true } | { ok: false; status: number } {
  const expected = process.env.CRON_SECRET;
  if (!expected) return { ok: false, status: 503 };

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!presented) return { ok: false, status: 401 };

  // Length-independent compare: bail on length first, then diff every byte so
  // the loop cannot return early on the first mismatch.
  if (presented.length !== expected.length) return { ok: false, status: 401 };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? { ok: true } : { ok: false, status: 401 };
}
