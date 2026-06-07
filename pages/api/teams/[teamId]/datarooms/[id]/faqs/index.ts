import { NextApiRequest, NextApiResponse } from "next";

import publishFAQRoute from "@/features/conversations/api/team-faqs-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return await publishFAQRoute(req, res);
}
