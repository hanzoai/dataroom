import { NextResponse } from "next/server";

import { verifyCron } from "@/lib/cron/verify";
import { log } from "@/lib/utils";
import { processEmailQueue } from "@/lib/year-in-review/send-emails";

// Runs every hour (0 * * * *)
export const maxDuration = 300; // 5 minutes in seconds

export async function POST(req: Request) {
  const body = await req.json();
  const auth = verifyCron(req);
  if (!auth.ok) {
    return new Response("Unauthorized", { status: auth.status });
  }

  try {
    await processEmailQueue();
    return NextResponse.json({ success: true });
  } catch (error) {
    await log({
      message: `Year in review email cron failed. \n\nError: ${(error as Error).message}`,
      type: "cron",
      mention: true,
    });
    return NextResponse.json({ error: (error as Error).message });
  }
}
