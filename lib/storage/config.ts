/**
 * Object storage configuration.
 *
 * One bucket, resolved once from the environment. Any S3-compatible endpoint
 * works (hanzoai/s3, AWS S3, MinIO) — point NEXT_PRIVATE_UPLOAD_ENDPOINT at it.
 */

export interface StorageConfig {
  bucket: string;
  advancedBucket?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  distributionHost?: string;
  advancedDistributionHost?: string;
  distributionKeyId?: string;
  distributionKeyContents?: string;
  lambdaFunctionName?: string;
}

const DEFAULT_REGION = "us-east-1";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

/**
 * Reads the storage configuration from the environment.
 *
 * Throws if a required variable is unset — an upload route that cannot name
 * its bucket must fail at the boundary, not write somewhere unintended.
 */
export function getStorageConfig(): StorageConfig {
  return {
    bucket: required("NEXT_PRIVATE_UPLOAD_BUCKET"),
    advancedBucket: optional("NEXT_PRIVATE_ADVANCED_UPLOAD_BUCKET"),
    region: optional("NEXT_PRIVATE_UPLOAD_REGION") ?? DEFAULT_REGION,
    accessKeyId: required("NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID"),
    secretAccessKey: required("NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY"),
    endpoint: optional("NEXT_PRIVATE_UPLOAD_ENDPOINT"),
    distributionHost: optional("NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST"),
    advancedDistributionHost: optional(
      "NEXT_PRIVATE_ADVANCED_UPLOAD_DISTRIBUTION_HOST",
    ),
    distributionKeyId: optional("NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID"),
    distributionKeyContents: optional(
      "NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS",
    ),
    lambdaFunctionName: optional("NEXT_PRIVATE_LAMBDA_FUNCTION_NAME"),
  };
}
