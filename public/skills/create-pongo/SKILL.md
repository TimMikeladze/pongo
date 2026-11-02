---
name: create-pongo
description: Use when someone shares pongo.sh or asks to create, configure, run, or deploy a Pongo status page with uptime monitors. Also use when adding services to an existing Pongo instance.
---

# Create a Pongo status page

Turn a request such as `https://pongo.sh Create a status page for Acme` into a configured, running Pongo instance. Pongo is a self-hosted Bun and Next.js application, not a service that provisions pages through pongo.sh. Use terminal and file tools to perform the setup; if those tools are unavailable, provide the commands and state that nothing has been run.

## Gather missing inputs

Use details already present in the request or project. Ask one short question at a time, only when its answer changes the configuration:

- If endpoints are missing: “Which services should appear on the page, and what URL should each check?” Ask for exact health URLs; do not invent `/health` paths from a company name.
- If deployment is requested without a target: “Where should this run: Vercel, Fly.io, Docker, or an existing server?” Identify any missing provider access or database credentials before deployment.
- If notifications are requested: ask for the destination and its webhook payload requirements. Pongo sends its own JSON webhook payload; Slack, Discord, and PagerDuty can need an adapter. Store tokens outside source control.

Use a local SQLite database, a public dashboard, `interval: "1m"`, `timeout: "10s"`, and no alerts or archival unless requested. Derive a readable page name and a URL-safe slug from the user's project name. State these defaults briefly and proceed when the service URLs are known. For an otherwise unspecified setup, run locally; local setup does not publish an internet-accessible site.

## Prepare the checkout

For an existing Pongo project, inspect its instructions, configuration, and environment before editing. Preserve existing monitors, dashboards, secrets, and unrelated changes.

For a new instance, clone into an unused directory:

```bash
git clone https://github.com/TimMikeladze/pongo.git acme-status
cd acme-status
bun install
```

Replace `acme-status` with the selected directory. Check that Bun is installed; use the user's approved installation method if it is missing. Create `.env` from `.env.example` only when `.env` does not already exist. Configure these values, adapting the site name and available web port:

```dotenv
DATABASE_URL=file:./pongo/pongo.db
NEXT_PUBLIC_SITE_NAME="Acme Status"
NEXT_PUBLIC_URL=http://localhost:3000
```

For a remote database, set its actual `DATABASE_URL` instead. Use `DB_DRIVER=sqlite` for SQLite/libSQL or `DB_DRIVER=pg` for PostgreSQL if a driver override is needed. Remote libSQL also needs `TURSO_AUTH_TOKEN`. Keep the web process and scheduler on the same database and environment.

Read the checked-out `src/lib/config-types.ts`, both configuration index files, `.env.example`, and `package.json` before editing; use their current interfaces if they differ from these examples. Read the installed Next.js guides under `node_modules/next/dist/docs/` before changing framework code. A status-page setup normally needs only `pongo/` configuration and environment variables.

## Configure monitors and the page

Create one monitor per supplied service. Replace the example URL with the user's endpoint:

```typescript
// pongo/monitors/website.ts
import { monitor } from "@/lib/config-types";

export default monitor({
  name: "Website",
  interval: "1m",
  timeout: "10s",
  async handler() {
    const start = Date.now();
    const response = await fetch("https://example.com", {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return {
      status: response.ok ? "up" : "down",
      responseTime: Date.now() - start,
      statusCode: response.status,
    };
  },
});
```

The runner records thrown network errors and timeouts as down results. Adapt the success predicate when the user requires a specific status or response body. Keep authenticated request credentials in environment variables. Use `cron: "*/5 * * * *"` for a cron expression; `interval` accepts duration strings such as `30s`, `1m`, and `1h`.

Register the monitor and dashboard explicitly:

```typescript
// pongo/monitors/index.ts
import website from "./website";
export default { website };
```

```typescript
// pongo/dashboards/acme.ts
import type { DashboardConfig } from "@/lib/config-types";

const acme: DashboardConfig = {
  name: "Acme Status",
  slug: "acme",
  public: true,
  monitors: ["website"],
};

export default acme;
```

```typescript
// pongo/dashboards/index.ts
import acme from "./acme";
export default { acme };
```

The default-export object's keys determine IDs; adding a file alone does not register it. Dashboard `monitors` entries must match those keys. The dashboard registry key is its internal ID; `slug` determines `/shared/acme`. Preserve existing registry entries when extending a project. In a fresh clone, replace demo registry entries with the user's services and page; leave unused example files unregistered. Do not publish sample incidents or announcements as the user's history. Markdown `dashboard` fields refer to the dashboard registry key.

Optional branding variables are documented in `.env.example`: `NEXT_PUBLIC_FAVICON`, `NEXT_PUBLIC_FOOTER_LOGO`, `NEXT_PUBLIC_FOOTER_TITLE`, and `NEXT_PUBLIC_FOOTER_CAPTION`. Store local image assets in `public/`.

## Migrate and run

Run the command for the selected database:

```bash
bun run db:sqlite:migrate  # Local SQLite
# bun run db:pg:migrate   # PostgreSQL instead
```

For remote libSQL, the bundled SQLite migration config does not pass an auth token. Create `drizzle.config.turso.ts` and migrate with `bunx drizzle-kit migrate --config=drizzle.config.turso.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle/sqlite",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

Start the web app and scheduler in separate terminals from the same checkout:

```bash
bun dev --port 3000
```

```bash
SCHEDULER_PORT=3001 bun scheduler
```

Check port availability first. Use other free ports if needed; update `NEXT_PUBLIC_URL`, and set `SCHEDULER_URL` when enabling manual runs from the UI. Leave existing applications running. Restart the scheduler after configuration changes; production web changes require a rebuild.

Before making the instance network-accessible, configure `ACCESS_CODE` for admin login and a generated `SESSION_SECRET` of at least 32 characters. `/shared/<slug>` remains public. Keep the scheduler bound to its default `127.0.0.1`; a network-accessible scheduler needs `SCHEDULER_SECRET`. Its API uses `Authorization: Bearer <SCHEDULER_SECRET>` when configured. Generate and store secrets locally without printing them or committing `.env`.

## Verify the running instance

Use the selected ports and registered IDs in these requests:

```bash
curl --fail http://localhost:3001/health
curl --fail -X POST http://localhost:3001/monitors/website/trigger
curl --fail http://localhost:3001/monitors/website
curl --fail http://localhost:3000/shared/acme
```

Include the bearer header for scheduler requests when `SCHEDULER_SECRET` is set. Repeat the trigger and state requests for every configured monitor. If a scheduled check is already running, the trigger can return before that check finishes. Poll the monitor state until `isRunning` is false and `lastRun` has a timestamp from this run. Failed checks retry; with the default three retries and the example ten-second timeout, allow up to 75 seconds for an outcome. Verify non-null `lastStatus` and `lastResponseTime`.

Verify a persisted row for each monitor in the `pongo_check_results` table of the selected database, with a timestamp from this run; a healthy scheduler alone is insufficient. Open the public page without login and check its service names and rendered results. The status JSON route `/shared/<slug>/status.json` is an additional check, but its aggregate can report operational before any checks exist.

Run `bun run tsc --noEmit` and `bun run test`. Report an endpoint returning down as the observed outcome; never alter the monitor to manufacture an up result. If tools or credentials block a check, state exactly which verification is incomplete.

Finish with the public page URL, monitored services and actual check outcomes, edited configuration paths, and commands to restart both processes. For deployment, include the deployed URL only after testing it. If credentials are missing, finish the local setup and name the remaining deployment requirement.

## Deploy when requested

Consult the checked-out deployment files and [README deployment instructions](https://github.com/TimMikeladze/pongo#deployment). Use the user's chosen provider and current provider documentation. Configure `NEXT_PUBLIC_URL` to the deployed origin and set branding before building. The web process and every scheduler need the same database and monitor configuration.

| Target | Database and runner |
| --- | --- |
| Local server / VPS | SQLite on persistent disk or PostgreSQL. Explicit migration, `bunx next build`, `bun start`, and a supervised `bun scheduler` process. |
| Docker | Build the included Dockerfile. Explicitly migrate using the image before starting the web container. Set `SCHEDULER_ENABLED=true` to start its scheduler with the web app, or run a separate scheduler container. SQLite requires the same persistent volume for migrations, web app, and scheduler. The entrypoint does not migrate. |
| Fly.io | Replace `fly.toml`'s `pongo-production` app name with a new app belonging to the user. Use the mounted `/data` volume with `DATABASE_URL=file:/data/pongo.db` for a single-host SQLite setup, or use PostgreSQL. Explicitly migrate and enable `SCHEDULER_ENABLED=true` if using the bundled scheduler. |
| Vercel | Use a remote PostgreSQL or libSQL database, set `CRON_SECRET`, and use `/api/cron` instead of a long-running scheduler. `vercel.json` currently runs every 30 minutes; one-minute monitor intervals cannot override that cadence. Select a provider-supported schedule or an external scheduler for faster checks. |

The current `bun run build` script chooses SQLite migrations only when `DATABASE_URL` starts with `sqlite`, so it selects PostgreSQL migrations for the documented `file:`/`libsql:` URLs and for an unset URL. Run the correct migration explicitly and use `bunx next build` for production builds; on Vercel set the build command to the selected migration followed by `bunx next build`. Reinspect `package.json` in case this has been corrected. Avoid running Vercel Cron and a standalone scheduler unintentionally for the same region.

Verify the live page without login, protected admin access, and a fresh recorded check from the production runner. Name any remaining domain, credentials, or process-supervision work instead of claiming the deployment is complete.
