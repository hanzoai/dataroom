import crypto from "crypto";
import { z } from "zod";

import { kv } from "@/lib/kv";

export const PREVIEW_EXPIRATION_TIME = 20 * 60 * 1000; // 20 minutes

const ZPreviewSessionSchema = z.object({
  userId: z.string(),
  linkId: z.string(),
  expiresAt: z.number(),
});

type PreviewSession = z.infer<typeof ZPreviewSessionSchema>;

async function createPreviewSession(
  linkId: string,
  userId: string,
): Promise<{ token: string; expiresAt: number }> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + PREVIEW_EXPIRATION_TIME;

  const sessionData: PreviewSession = {
    linkId,
    userId,
    expiresAt,
  };

  // Validate session data before storing
  ZPreviewSessionSchema.parse(sessionData);

  // Store session in KV
  await kv.set(
    `preview_session:${sessionToken}`,
    JSON.stringify(sessionData),
    { pxat: expiresAt },
  );

  return {
    token: sessionToken,
    expiresAt,
  };
}

async function verifyPreviewSession(
  previewToken: string,
  userId: string,
  linkId: string,
): Promise<PreviewSession | null> {
  const sessionToken = previewToken;
  if (!sessionToken) return null;

  const session = await kv.get(`preview_session:${sessionToken}`);
  if (!session) return null;

  try {
    const sessionData = ZPreviewSessionSchema.parse(session);

    // Check if the session is for the correct user
    if (sessionData.userId !== userId) {
      await kv.del(`preview_session:${sessionToken}`);
      return null;
    }

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      await kv.del(`preview_session:${sessionToken}`);
      return null;
    }

    // Check if the session is for the correct link and dataroom
    if (sessionData.linkId !== linkId) {
      await kv.del(`preview_session:${sessionToken}`);
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("Preview session verification error:", error);
    await kv.del(`preview_session:${sessionToken}`);
    return null;
  }
}

export { createPreviewSession, verifyPreviewSession };
export type { PreviewSession };
