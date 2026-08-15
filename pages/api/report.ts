import type { NextApiRequest, NextApiResponse } from "next";

import { after } from "@/lib/after";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { kv } from "@/lib/kv";

const bodyValidation = z.object({
  linkId: z.string(),
  documentId: z.string(),
  viewId: z.string(),
  abuseType: z.number().int().min(1).max(6),
});

export const config = {
  // so background work can outlive the response
  supportsResponseStreaming: true,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { linkId, documentId, viewId, abuseType } = req.body as {
    linkId: string;
    documentId: string;
    viewId: string;
    abuseType: number;
  };
  const result = bodyValidation.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const view = await prisma.view.findUnique({
      where: {
        id: viewId,
        linkId,
        documentId,
      },
      select: { id: true },
    });

    if (!view) {
      return res.status(400).json({
        status: "error",
        message: "View not found",
      });
    }
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      message: (err as Error).message,
    });
  }

  try {
    // Create a unique KV key to track reports for the documentId
    const reportKey = `report:doc_${documentId}`;
    const viewIdValue = `view_${viewId}`;

    // Check if the viewId has already reported for this documentId
    const hasReported = await kv.sismember(reportKey, viewIdValue);
    if (hasReported) {
      return res.status(400).json({
        status: "error",
        message: "You have already reported this document",
      });
    }

    // Perform all non-dependent KV operations in parallel
    after(
      Promise.all([
        // Add the viewId to the KV set for this documentId
        kv.sadd(reportKey, viewIdValue),

        // Increment the report count for the documentId
        kv.hincrby("reportCount", `doc_${documentId}`, 1),

        // Store the abuse type report under a KV hash for future analysis
        kv.hset(`report:doc_${documentId}:details`, {
          [viewIdValue]: abuseType, // Store the abuseType as a number for this viewId
        }),
      ]),
    );

    return res.status(200).json({
      status: "success",
      message: "Report submitted successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      message: (err as Error).message,
    });
  }
}
