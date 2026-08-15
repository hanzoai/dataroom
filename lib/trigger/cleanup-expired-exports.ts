import { logger, schedules } from "@trigger.dev/sdk/v3";

import { jobStore } from "@/lib/kv-job-store";
import { deleteFile } from "@/lib/files/delete-file-server";
import { DocumentStorageType } from "@prisma/client";

export const cleanupExpiredExports = schedules.task({
  id: "cleanup-expired-exports",
  // Run daily at 2 AM UTC
  cron: "0 2 * * *",
  run: async (payload) => {
    logger.info("Starting cleanup of expired exports", {
      timestamp: payload.timestamp,
    });

    try {
      // Get all blob URLs that are due for cleanup
      const expired = await jobStore.getExpiredForCleanup();

      if (expired.length === 0) {
        logger.info("Nothing due for cleanup");
        return { deletedCount: 0 };
      }

      logger.info(`Found ${expired.length} to delete`);

      // Delete from our object storage
      const deletionResults = await Promise.allSettled(
        expired.map(async (item) => {
          try {
            await deleteFile({
              type: DocumentStorageType.S3_PATH,
              data: item.path,
              teamId: item.teamId,
            });

            // Remove from cleanup queue after successful deletion
            await jobStore.removeFromCleanupQueue(item.path, item.jobId);

            logger.info("Deleted", {
              path: item.path,
              jobId: item.jobId,
            });

            return { path: item.path, success: true };
          } catch (error) {
            logger.error("Failed to delete", {
              path: item.path,
              jobId: item.jobId,
              error: error instanceof Error ? error.message : String(error),
            });
            return { path: item.path, success: false, error };
          }
        }),
      );

      const successCount = deletionResults.filter(
        (result) => result.status === "fulfilled" && result.value.success,
      ).length;

      const failureCount = deletionResults.length - successCount;

      logger.info("Cleanup completed", {
        totalBlobs: expired.length,
        successCount,
        failureCount,
      });

      return {
        deletedCount: successCount,
        failureCount,
        totalProcessed: expired.length,
      };
    } catch (error) {
      logger.error("Cleanup task failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});
