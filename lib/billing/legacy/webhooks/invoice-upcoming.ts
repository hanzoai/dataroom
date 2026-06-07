import { NextApiResponse } from "next";

import type { CommerceTypes } from "@/lib/commerce";

/**
 * No-op invoice-upcoming handler. The renewal-reminder email subsystem was
 * removed when the commercial-license paywall was ripped.
 */
export async function invoiceUpcoming(
  _event: CommerceTypes.Event,
  res: NextApiResponse,
  _isOldAccount: boolean = false,
) {
  return res.status(200).json({ received: true });
}
