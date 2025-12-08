// src/archiver/s3.ts

import { readFile, unlink } from "node:fs/promises";
import {
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import type { ArchiverConfig } from "./types";

let s3Client: S3Client | null = null;

export function getS3Client(config: ArchiverConfig): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      },
    });
  }
  return s3Client;
}

export async function uploadToS3(
  config: ArchiverConfig,
  localFilePath: string,
  s3Key: string,
): Promise<void> {
  const client = getS3Client(config);
  const fileContent = await readFile(localFilePath);

  const params: PutObjectCommandInput = {
    Bucket: config.s3Bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: "application/octet-stream",
  };

  await client.send(new PutObjectCommand(params));
  console.log(`[archiver] Uploaded to s3://${config.s3Bucket}/${s3Key}`);
}

export async function deleteLocalFile(filePath: string): Promise<void> {
  await unlink(filePath);
  console.log(`[archiver] Deleted local file: ${filePath}`);
}
