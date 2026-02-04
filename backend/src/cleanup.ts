import { deleteOldLogs } from "./database/database.js";

export function startCleanupTask(retentionDays: number): void {
  // Run cleanup every 24 hours
  const cleanupInterval = 24 * 60 * 60 * 1000;

  setInterval(() => {
    try {
      const deleted = deleteOldLogs(retentionDays);
      console.log(`Cleanup task: deleted ${deleted} old logs`);
    } catch (error) {
      console.error("Cleanup task error:", error);
    }
  }, cleanupInterval);

  console.log(
    `Cleanup task started: will delete non-critical logs older than ${retentionDays} days`,
  );
}
