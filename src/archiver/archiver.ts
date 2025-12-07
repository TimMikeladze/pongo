// src/archiver/archiver.ts

import { join } from "node:path";
import { Cron } from "croner";
import { and, inArray, isNull, lt } from "drizzle-orm";
import { checkResults, getDb } from "@/db";
import { writeParquetFile } from "./parquet";
import { deleteLocalFile, uploadToS3 } from "./s3";
import {
  type ArchivalRow,
  type ArchiverConfig,
  formatPartitionKey,
  partitionKeyToS3Path,
} from "./types";

export class Archiver {
  private config: ArchiverConfig;
  private job: Cron | null = null;
  private isRunning = false;

  constructor(config: ArchiverConfig) {
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      console.log("[archiver] Archival is disabled");
      return;
    }

    console.log(`[archiver] Starting archiver with cron: ${this.config.cron}`);
    console.log(`[archiver] Retention: ${this.config.retentionDays} days`);
    console.log(`[archiver] Batch size: ${this.config.batchSize}`);
    console.log(
      `[archiver] S3 bucket: ${this.config.s3Bucket}/${this.config.s3Prefix}`,
    );

    this.job = new Cron(this.config.cron, { protect: true }, () => {
      this.runArchival();
    });

    console.log("[archiver] Archiver scheduled");
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log("[archiver] Archiver stopped");
    }
  }

  async runArchival(): Promise<void> {
    if (this.isRunning) {
      console.log("[archiver] Archival already running, skipping");
      return;
    }

    this.isRunning = true;
    console.log("[archiver] Starting archival run...");

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let totalArchived = 0;
      let hasMore = true;

      while (hasMore) {
        const archivedCount = await this.archiveBatch(cutoffDate);
        totalArchived += archivedCount;
        hasMore = archivedCount === this.config.batchSize;
      }

      console.log(
        `[archiver] Archival complete. Total rows archived: ${totalArchived}`,
      );
    } catch (error) {
      console.error("[archiver] Archival failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  private async archiveBatch(cutoffDate: Date): Promise<number> {
    const db = await getDb();

    // Select rows eligible for archival
    const rows = await db
      .select()
      .from(checkResults)
      .where(
        and(
          lt(checkResults.checkedAt, cutoffDate),
          isNull(checkResults.archivedAt),
        ),
      )
      .limit(this.config.batchSize);

    if (rows.length === 0) {
      return 0;
    }

    const rowIds = rows.map((r: { id: string }) => r.id);
    const batchId = crypto.randomUUID();
    const now = new Date();

    console.log(
      `[archiver] Processing batch ${batchId} with ${rows.length} rows`,
    );

    // Mark rows as archiving
    await db
      .update(checkResults)
      .set({ archivedAt: now })
      .where(inArray(checkResults.id, rowIds));

    // Group rows by day partition
    const partitions = new Map<string, ArchivalRow[]>();
    for (const row of rows) {
      const checkedAt =
        row.checkedAt instanceof Date ? row.checkedAt : new Date(row.checkedAt);
      const partitionKey = formatPartitionKey(checkedAt);

      const archivalRow: ArchivalRow = {
        id: row.id,
        monitorId: row.monitorId,
        status: row.status,
        responseTimeMs: row.responseTimeMs,
        statusCode: row.statusCode,
        message: row.message,
        checkedAt,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt
            : new Date(row.createdAt),
      };

      const existing = partitions.get(partitionKey);
      if (existing) {
        existing.push(archivalRow);
      } else {
        partitions.set(partitionKey, [archivalRow]);
      }
    }

    // Process each partition
    const successfulPartitions: string[] = [];
    const successfulRowIds: string[] = [];

    for (const [partitionKey, partitionRows] of partitions) {
      const fileName = `pongo_check_results_${batchId}.parquet`;
      const localPath = join(
        this.config.localPath,
        `year=${partitionKey.split("-")[0]}`,
        `month=${partitionKey.split("-")[1]}`,
        `day=${partitionKey.split("-")[2]}`,
        fileName,
      );
      const s3Path = `${partitionKeyToS3Path(partitionKey, this.config.s3Prefix)}/${fileName}`;

      try {
        // Write parquet file
        await writeParquetFile(partitionRows, localPath);

        // Upload to S3
        await uploadToS3(this.config, localPath, s3Path);

        // Track success
        successfulPartitions.push(partitionKey);
        successfulRowIds.push(...partitionRows.map((r) => r.id));

        // Delete local file
        await deleteLocalFile(localPath);
      } catch (error) {
        console.error(
          `[archiver] Failed to archive partition ${partitionKey}:`,
          error,
        );
        // Continue with other partitions
      }
    }

    // Delete successfully archived rows from DB
    if (successfulRowIds.length > 0) {
      await db
        .delete(checkResults)
        .where(inArray(checkResults.id, successfulRowIds));

      console.log(
        `[archiver] Deleted ${successfulRowIds.length} archived rows from database`,
      );
    }

    // Clear archivedAt for failed rows so they retry next run
    const failedRowIds = rowIds.filter(
      (id: string) => !successfulRowIds.includes(id),
    );
    if (failedRowIds.length > 0) {
      await db
        .update(checkResults)
        .set({ archivedAt: null })
        .where(inArray(checkResults.id, failedRowIds));

      console.log(
        `[archiver] Reset ${failedRowIds.length} failed rows for retry`,
      );
    }

    return rows.length;
  }

  async trigger(): Promise<void> {
    console.log("[archiver] Manual trigger requested");
    await this.runArchival();
  }
}
