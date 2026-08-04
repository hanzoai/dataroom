import { S3Store } from "@tus/s3-store";

import { getStorageConfig } from "@/lib/storage/config";

/** Multipart part size for resumable uploads. */
const PART_SIZE = 8 * 1024 * 1024;

/**
 * Builds the tus datastore for resumable uploads.
 *
 * The store is stateless with respect to the request: bucket and credentials
 * are fixed at construction, so concurrent uploads from different teams cannot
 * observe each other's configuration.
 */
export function createTusStore(): S3Store {
  const config = getStorageConfig();

  return new S3Store({
    partSize: PART_SIZE,
    s3ClientConfig: {
      bucket: config.bucket,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Set for hanzoai/s3; AWS ignores it.
      ...(config.endpoint
        ? { endpoint: config.endpoint, forcePathStyle: true }
        : {}),
    },
  });
}
