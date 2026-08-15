import { NextResponse } from "next/server";

import { verifyCron } from "@/lib/cron/verify";
import { processDataroomDigest } from "@/lib/emails/process-dataroom-digest";
import { log } from "@/lib/utils";

// Runs daily at 9 AM UTC (0 9 * * *)
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const auth = verifyCron(req);
  if (!auth.ok) {
    return new Response("Unauthorized", { status: auth.status });
  }

  try {
    const result = await processDataroomDigest("daily");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    await log({
      message: `Daily dataroom digest cron failed. \n\nError: ${(error as Error).message}`,
      type: "cron",
      mention: true,
    });
    return NextResponse.json({ error: (error as Error).message });
  }
}
