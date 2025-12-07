# TTL Archival Design

## Overview

Add TTL-based data archival that moves old monitoring data from the database to Parquet files on S3.

## Environment Variables

```bash
ARCHIVAL_ENABLED=true
ARCHIVAL_RETENTION_DAYS=30           # Keep this many days in DB
ARCHIVAL_CRON="0 3 * * *"            # When to run (default: 3am daily)
ARCHIVAL_BATCH_SIZE=10000            # Rows per batch
ARCHIVAL_LOCAL_PATH=./archives       # Temp parquet location before S3 upload

S3_BUCKET=my-bucket
S3_PREFIX=pongo/archives             # Optional prefix in bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## File Structure

Hive-partitioned by day:
```
s3://my-bucket/pongo/archives/year=2024/month=01/day=15/check_results_<batch_id>.parquet
```

Late-arriving data creates new parquet files for that day (append, not overwrite).

## Architecture

```
src/archiver/
├── index.ts      - Entry point (bun run archiver)
├── archiver.ts   - Main archival logic + scheduling
├── parquet.ts    - Parquet file writing
├── s3.ts         - S3 upload operations
└── types.ts      - Config and type definitions
```

Run via: `bun run archiver`

## Database Schema Changes

Add `archived_at` column to `check_results`:

```typescript
// schema.sqlite.ts / schema.pg.ts
archivedAt: integer("archived_at", { mode: "timestamp_ms" }), // null = not archived
```

New index for archival queries:
```sql
CREATE INDEX idx_check_results_archival
ON check_results(checked_at)
WHERE archived_at IS NULL;
```

## Archival Flow

1. **Select eligible rows**
   ```sql
   SELECT * FROM check_results
   WHERE checked_at < (now - retention_days)
   AND archived_at IS NULL
   LIMIT batch_size
   ```

2. **Mark rows as archiving**
   ```sql
   UPDATE check_results SET archived_at = now() WHERE id IN (...)
   ```

3. **Group by day** - organize rows into Hive partitions

4. **Write Parquet files** - one file per day partition per batch

5. **Upload to S3** - put files in `s3://bucket/prefix/year=YYYY/month=MM/day=DD/`

6. **On success**: Delete rows from DB + delete local parquet files

7. **On failure**: Clear `archived_at` so rows retry next run
   ```sql
   UPDATE check_results SET archived_at = NULL WHERE id IN (...)
   ```

## Dependencies

- `@aws-sdk/client-s3` - S3 uploads
- `parquetjs` or similar - Parquet file writing

## Package.json Addition

```json
{
  "scripts": {
    "archiver": "bun run src/archiver/index.ts"
  }
}
```

## Failure Handling

- S3 upload failure: rows remain in DB (archived_at cleared), local parquet deleted, retry next run
- Partial batch failure: each day-partition uploaded independently, only successful ones purged
- Process crash: archived_at marks stale rows, can add cleanup on startup for rows marked > 1 hour ago
