import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";

import { type StorageConfig, getStorageConfig } from "@/lib/storage/config";

/**
 * Resolves the storage config, refusing when the deployment is not on S3.
 *
 * Callers reach object storage through this, so the transport check lives here
 * once rather than at every call site.
 */
function requireS3Config(): StorageConfig {
  if (process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT !== "s3") {
    throw new Error("Invalid upload transport");
  }
  return getStorageConfig();
}

/** S3 client plus the config it was built from. */
export function getS3ClientAndConfig(): {
  client: S3Client;
  config: StorageConfig;
} {
  const config = requireS3Config();

  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    // Path-style addressing keeps S3-compatible endpoints working.
    forcePathStyle: Boolean(config.endpoint),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, config };
}

/** Lambda client for the document-conversion functions. */
export function getLambdaClient(): LambdaClient {
  const config = requireS3Config();

  return new LambdaClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}
