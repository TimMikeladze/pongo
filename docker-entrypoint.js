#!/usr/bin/env node

const { spawn } = require("node:child_process");

const env = { ...process.env };
const command = process.argv.slice(2).join(" ");
const schedulerEnabled = process.env.SCHEDULER_ENABLED === "true";
const archiverEnabled = process.env.ARCHIVAL_ENABLED === "true";

(async () => {
  // Sync schema before starting any service (push is idempotent, migrate fails if tables exist)
  await exec("bun run db:sqlite:push");

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
