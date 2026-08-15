import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";

import { type StorageConfig, getStorageConfig } from "@/lib/storage/config";

/**
 * Resolves the storage config.
 *
 * There is one object store — ours — so there is no transport to choose. This
 * used to refuse unless NEXT_PUBLIC_UPLOAD_TRANSPORT was "s3", a variable the
 * deployment never set: it configures S3 through NEXT_PRIVATE_UPLOAD_*, so every
 * call through here threw "Invalid upload transport" in production while the
 * bucket, endpoint and credentials sat correctly configured beside it.
 *
 * getStorageConfig() still throws when a required variable is missing — an
 * upload route that cannot name its bucket must fail at the boundary rather
 * than write somewhere unintended.
 */
function requireS3Config(): StorageConfig {
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
