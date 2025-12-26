// src/archiver/index.ts

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Archiver } from "./archiver";
import type { ArchiverConfig } from "./types";

function loadConfig(): ArchiverConfig & { port: number } {
  const enabled = process.env.ARCHIVAL_ENABLED === "true";

  if (!enabled) {
    // Return minimal config when disabled
    return {
      enabled: false,
      retentionDays: 30,
      cron: "0 3 * * *",
      batchSize: 10000,
      localPath: "./archives",
      s3Bucket: "",
      s3Prefix: "",
      s3Region: "",
      s3AccessKeyId: "",
      s3SecretAccessKey: "",
      port: parseInt(process.env.ARCHIVER_PORT ?? "3002", 10),
    };
  }

  // Validate required S3 config when enabled
  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error(
      "S3 configuration required when ARCHIVAL_ENABLED=true. " +
        "Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
    );
  }

  return {
    enabled: true,
    retentionDays: parseInt(process.env.ARCHIVAL_RETENTION_DAYS ?? "30", 10),
    cron: process.env.ARCHIVAL_CRON ?? "0 3 * * *",
    batchSize: parseInt(process.env.ARCHIVAL_BATCH_SIZE ?? "10000", 10),
    localPath: process.env.ARCHIVAL_LOCAL_PATH ?? "./archives",
    s3Bucket,
    s3Prefix: process.env.S3_PREFIX ?? "pongo/archives",
    s3Region,
    s3AccessKeyId,
    s3SecretAccessKey,
    port: parseInt(process.env.ARCHIVER_PORT ?? "3002", 10),
  };
}

function createHealthServer() {
  const app = new Hono();

  app.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  return app;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Pongo Archiver");
  console.log("=".repeat(60));

  const config = loadConfig();

  // Start health server (even when archival is disabled, for Fly.io health checks)
  const app = createHealthServer();
  serve({ fetch: app.fetch, port: config.port });
  console.log(
    `[archiver] Health server listening on http://localhost:${config.port}`,
  );

  if (!config.enabled) {
    console.log(
      "[archiver] ARCHIVAL_ENABLED is not set to 'true'. Running in idle mode.",
    );
    // Keep process alive for health checks
    return;
  }

  const archiver = new Archiver(config);
  archiver.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[archiver] Received SIGINT, shutting down...");
    archiver.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[archiver] Received SIGTERM, shutting down...");
    archiver.stop();
    process.exit(0);
  });

  console.log("[archiver] Ready. Press Ctrl+C to stop.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
