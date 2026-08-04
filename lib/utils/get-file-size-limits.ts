/**
 * Upload constraints.
 *
 * These are operational limits — what the conversion and storage pipeline can
 * chew through — not commercial ones. Hanzo Dataroom has no paywall, so every
 * team gets the same ceiling. Tune per deployment via the env overrides.
 */
export type UploadLimits = {
  /** per-file ceilings, in megabytes, by kind */
  video: number;
  document: number;
  image: number;
  excel: number;
  /** files accepted in a single drop */
  maxFiles: number;
  /** pages rendered per document */
  maxPages: number;
};

const mb = (name: string, fallback: number): number => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

export const UPLOAD_LIMITS: UploadLimits = {
  video: mb("NEXT_PUBLIC_UPLOAD_LIMIT_VIDEO_MB", 500),
  document: mb("NEXT_PUBLIC_UPLOAD_LIMIT_DOCUMENT_MB", 350),
  image: mb("NEXT_PUBLIC_UPLOAD_LIMIT_IMAGE_MB", 100),
  excel: mb("NEXT_PUBLIC_UPLOAD_LIMIT_EXCEL_MB", 40),
  maxFiles: mb("NEXT_PUBLIC_UPLOAD_LIMIT_MAX_FILES", 150),
  maxPages: mb("NEXT_PUBLIC_UPLOAD_LIMIT_MAX_PAGES", 500),
};

/** Size ceiling in megabytes for a given content type. */
export function getFileSizeLimit(contentType: string): number {
  if (contentType.startsWith("video/")) return UPLOAD_LIMITS.video;
  if (contentType.startsWith("image/")) return UPLOAD_LIMITS.image;
  if (
    contentType.startsWith(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) ||
    contentType.startsWith("application/vnd.ms-excel") ||
    contentType.startsWith("application/vnd.oasis.opendocument.spreadsheet")
  ) {
    return UPLOAD_LIMITS.excel;
  }
  return UPLOAD_LIMITS.document;
}
