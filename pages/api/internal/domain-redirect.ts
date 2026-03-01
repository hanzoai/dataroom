import type { NextApiRequest, NextApiResponse } from "next";

import { getDomainRedirectUrl } from "@/lib/api/domains/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow internal middleware calls
  if (req.headers["x-middleware-internal"] !== "1") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const host = req.query.host as string;
  if (!host) {
    return res.status(400).json({ error: "Missing host" });
  }

  const redirectUrl = await getDomainRedirectUrl(host);
  return res.status(200).json({ redirectUrl: redirectUrl || null });
}
