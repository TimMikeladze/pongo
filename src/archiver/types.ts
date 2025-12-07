// src/archiver/types.ts

export interface ArchiverConfig {
  /** Whether archival is enabled */
  enabled: boolean;
  /** Number of days to retain in database */
  retentionDays: number;
  /** Cron expression for when to run archival */
  cron: string;
  /** Number of rows to process per batch */
  batchSize: number;
  /** Local directory for temporary parquet files */
  localPath: string;
  /** S3 bucket name */
  s3Bucket: string;
  /** S3 prefix/path within bucket */
  s3Prefix: string;
  /** S3 region */
  s3Region: string;
  /** S3 access key */
  s3AccessKeyId: string;
  /** S3 secret key */
  s3SecretAccessKey: string;
}

export interface ArchivalBatch {
  /** Unique batch ID */
  batchId: string;
  /** Row IDs in this batch */
  rowIds: string[];
  /** Rows grouped by day partition */
  partitions: Map<string, ArchivalRow[]>;
}

export interface ArchivalRow {
  id: string;
  monitorId: string;
  status: string;
  responseTimeMs: number;
  statusCode: number | null;
  message: string | null;
  checkedAt: Date;
  createdAt: Date;
}

export interface PartitionKey {
  year: number;
  month: number;
  day: number;
}

export function parsePartitionKey(key: string): PartitionKey {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function formatPartitionKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function partitionKeyToS3Path(key: string, prefix: string): string {
  const { year, month, day } = parsePartitionKey(key);
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${prefix}/year=${year}/month=${monthStr}/day=${dayStr}`;
}
