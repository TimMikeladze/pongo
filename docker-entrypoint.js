#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");

const env = { ...process.env };
const command = process.argv.slice(2).join(" ");
const schedulerEnabled = process.env.SCHEDULER_ENABLED === "true";
const archiverEnabled = process.env.ARCHIVAL_ENABLED === "true";
const dataDir = "/data";

(async () => {
  // Verify volume is accessible
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Volume not mounted at ${dataDir}`);
  }
  try {
    fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new Error(`Volume at ${dataDir} is not readable/writable`);
  }
  console.log(`Volume at ${dataDir} is accessible`);

  // Sync schema before starting any service (push is idempotent, migrate fails if tables exist)
  await exec("bun run db:sqlite:migrate");

  // If running the web server, prerender pages and optionally start background services
  if (command === "bun run start") {
    await exec("bun next build --experimental-build-mode generate");

    // Start scheduler in background if enabled
    if (schedulerEnabled) {
      spawn("bun", ["run", "src/scheduler/index.ts"], {
        shell: true,
        stdio: "inherit",
        env,
      });
    }

    // Start archiver in background if enabled
    if (archiverEnabled) {
      spawn("bun", ["run", "src/archiver/index.ts"], {
        shell: true,
        stdio: "inherit",
        env,
      });
    }
  }

  // Launch the requested command
  await exec(command);
})();

function exec(command) {
  const child = spawn(command, { shell: true, stdio: "inherit", env });
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} failed rc=${code}`));
      }
    });
  });
}
