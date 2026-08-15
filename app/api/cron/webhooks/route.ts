import { NextResponse } from "next/server";

import { verifyCron } from "@/lib/cron/verify";
import { drain, pending } from "@/lib/kv-queue/webhooks";

// POST /api/cron/webhooks — send what is waiting in the KV delivery queue.
//
// Delivery is pull-based on purpose: the request that triggered the event only
// enqueues, so a slow or dead customer endpoint can never hold up the write that
// produced it. Guarded by the same shared secret as every other /api/cron route,
// which fails closed.
export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = verifyCron(req);
  if (!auth.ok) {
    return new Response("Unauthorized", { status: auth.status });
  }

  const result = await drain();
  return NextResponse.json({ ...result, remaining: await pending() });
}
