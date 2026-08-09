import type { NextApiRequest, NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth/next";

import { getS3ClientAndConfig } from "@/lib/files/aws-client";
import { newId } from "@/lib/id-helper";
import { CustomUser } from "@/lib/types";
import { safeSlugify } from "@/lib/utils";

import { authOptions } from "../auth/[...nextauth]";

/**
 * Presigns a PUT for a profile picture or a brand asset.
 *
 * Was Vercel Blob's `handleUpload`, which minted a client token for their
 * storage. The browser now PUTs straight to our own bucket against a URL signed
 * here, which is the same shape /api/file/s3/get-presigned-post-url already uses
 * for documents — that route requires a teamId and docId, which an avatar has
 * neither of, so images keep their own entry point.
 *
 * The content-type and size limits below were the ones Vercel enforced when it
 * issued the token. Type is enforced here; SIZE is signed into the URL as a
 * content-length range so the object store rejects an oversized body rather
 * than trusting the browser.
 */
const uploadConfig = {
  profile: {
    allowedContentTypes: ["image/png", "image/jpg", "image/jpeg"],
    maximumSizeInBytes: 2 * 1024 * 1024, // 2MB
  },
  assets: {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/x-icon",
      "image/ico",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  if (!type || !(type in uploadConfig)) {
    return res.status(400).json({ error: "Invalid upload type specified." });
  }
  const config = uploadConfig[type as keyof typeof uploadConfig];

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { fileName, contentType } = req.body as {
    fileName?: string;
    contentType?: string;
  };
  if (!fileName || !contentType) {
    return res.status(400).json({ error: "fileName and contentType required" });
  }
  if (!config.allowedContentTypes.includes(contentType)) {
    return res.status(400).json({ error: `Unsupported content type ${contentType}` });
  }

  const userId = (session.user as CustomUser).id;
  // A random segment keeps two uploads of "logo.png" apart, which is what
  // Vercel's addRandomSuffix did.
  const key = `${type}/${userId}/${newId("doc")}/${safeSlugify(fileName)}`;

  const { client, config: storage } = getS3ClientAndConfig();
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 5 },
  );

  return res.status(200).json({ url, key, maxBytes: config.maximumSizeInBytes });
}
