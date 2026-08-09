import { after as nextAfter } from "next/server";

/**
 * Run work that must not delay the response.
 *
 * This replaces @vercel/functions' `waitUntil`, which existed because a
 * serverless invocation is frozen the moment it responds — anything still
 * running is killed unless the platform is told to wait. This app is a
 * long-lived Node process on Kubernetes, so nothing freezes and that promise was
 * never at risk.
 *
 * Next's own `after()` is still the right call where it works: in the App Router
 * it schedules the work against the request, so it runs after the response is
 * flushed rather than racing it. It needs App Router request context and THROWS
 * without one, and two thirds of the call sites here are Pages Router API
 * routes — so outside that context the promise simply runs detached, which on a
 * persistent server is all `waitUntil` ever bought.
 *
 * Either way the promise is caught. A background rejection with no handler takes
 * the process down under Node's default unhandled-rejection policy, and losing a
 * pod because an analytics call 500'd is not a trade worth making.
 */
export function after(work: Promise<unknown> | (() => Promise<unknown>)): void {
  const run = () =>
    (typeof work === "function" ? work() : work).catch((error: unknown) => {
      console.error("[after] background work failed", error);
    });

  try {
    nextAfter(run);
  } catch {
    // No App Router request context (Pages Router, or outside a request).
    void run();
  }
}
