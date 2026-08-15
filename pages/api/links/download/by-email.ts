import { NextApiRequest, NextApiResponse } from "next";

import { getDataroomSessionByLinkIdInPagesRouter } from "@/lib/auth/dataroom-auth";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/kv";
import { getIpAddress } from "@/lib/utils/ip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. IP-based rate limiting (same pattern as OTP endpoints in verify.ts)
  const ipAddress = getIpAddress(req.headers) ?? "unknown";
  const { success } = await ratelimit(10, "1 m").limit(
    `download-by-email-ip:${ipAddress}`,
  );
  if (!success) {
    return res
      .status(429)
      .json({ error: "Too many requests. Try again later." });
  }

  const { linkId, email } = req.body as { linkId?: string; email?: string };
  if (!linkId || !email) {
    return res.status(400).json({ error: "linkId and email are required" });
  }

  // 2. Require a valid dataroom session
  const session = await getDataroomSessionByLinkIdInPagesRouter(req, linkId);
  if (!session) {
    return res.status(401).json({ error: "Session required" });
  }

  // 3. Prevent email enumeration — always return 200 with uniform body
  // `contains` rather than `equals` because sqlite compares strings with `=`
  // case-sensitively, and this has to match the address however the visitor
  // typed it. `contains` goes through LIKE, which sqlite treats
  // case-insensitively for ascii. It is a substring match, so one address can
  // be found inside another, and the exact comparison below settles it.
  const views = await prisma.view.findMany({
    where: {
      linkId,
      viewType: "DATAROOM_VIEW",
      viewerEmail: { contains: email },
    },
    select: { id: true, viewerEmail: true },
    orderBy: { viewedAt: "desc" },
  });
  const view = views.find(
    (v) => v.viewerEmail?.toLowerCase() === email.toLowerCase(),
  );

  return res.status(200).json({ viewId: view?.id ?? null });
}
