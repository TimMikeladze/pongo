// src/archiver/parquet.ts

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import parquet from "parquetjs-lite";
import type { ArchivalRow } from "./types";

const checkResultsSchema = new parquet.ParquetSchema({
  id: { type: "UTF8" },
  monitor_id: { type: "UTF8" },
  status: { type: "UTF8" },
  response_time_ms: { type: "DOUBLE" },
  status_code: { type: "INT32", optional: true },
  message: { type: "UTF8", optional: true },
  checked_at: { type: "TIMESTAMP_MILLIS" },
  created_at: { type: "TIMESTAMP_MILLIS" },
});

export async function writeParquetFile(
  rows: ArchivalRow[],
  filePath: string,
): Promise<void> {
  // Ensure directory exists
  await mkdir(dirname(filePath), { recursive: true });

  const writer = await parquet.ParquetWriter.openFile(
    checkResultsSchema,
    filePath,
  );

  for (const row of rows) {
    await writer.appendRow({
      id: row.id,
      monitor_id: row.monitorId,
      status: row.status,
      response_time_ms: row.responseTimeMs,
      status_code: row.statusCode,
      message: row.message,
      checked_at: row.checkedAt.getTime(),
      created_at: row.createdAt.getTime(),
    });
  }

  await writer.close();
  console.log(`[archiver] Wrote ${rows.length} rows to ${filePath}`);
}
