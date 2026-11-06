# Prompt-based Pongo setup

Make `https://pongo.sh Create a status page for Acme` enough for a coding agent to discover setup instructions, ask for missing service URLs, configure Pongo, and verify a running page.

## Implementation

- Serve `public/llms.txt` as the entry point. Link to a self-contained, installable skill at `public/skills/create-pongo/SKILL.md`; keep one copy of the skill, served directly by Next.js.
- Describe a local-first flow with SQLite, explicit migrations, registered monitors and dashboards, branding, and a separate scheduler. Ask only for missing endpoints or deployment choices. Preserve existing projects and credentials.
- Cover production choices without promising deployment before credentials exist. Document the actual Vercel cron cadence, persistent storage, explicit database migrations, and replacing the example Fly app name.
- Link agent instructions from the HTML head, homepage about section, and README. Add a human setup guide with example prompts and optional skill installation.
- Keep the two instruction URLs accessible when `ACCESS_CODE` is enabled, while preserving login requirements on admin routes.

## Verification

Test the authentication boundary before changing the proxy. Validate skill frontmatter and local links. Follow the skill in an isolated checkout with a local HTTP fixture and temporary SQLite database; require a recorded check and an unauthenticated public page. Run lint, type checking, and unit tests. Do not deploy or alter the current environment/database.

## Existing pitfalls to account for

Registry object keys determine IDs; filenames alone do not register configuration. Cron expressions belong in `cron`, not `interval`. The current build script selects PostgreSQL migrations for a `file:` SQLite URL, so instruct explicit migrations followed by `bunx next build` for production instead of relying on `bun run build`. The Vercel schedule is every 30 minutes. The Docker entrypoint does not migrate. `fly.toml` names the maintainer's existing app.

## Initial setup verification (main checkout)

- Skill frontmatter validates; local documentation links resolve. An independent setup run exposed a narrow inferred dashboard type and an incorrect table name in the first draft; the final skill uses an explicit `DashboardConfig`, names `pongo_check_results`, and accounts for in-progress checks and retries.
- The isolated SQLite instance recorded Website up (HTTP 200) and API down (HTTP 503). Public instructions and the status page returned 200 without login; admin routes redirected to login with `ACCESS_CODE` enabled.
- Headless Playwright verified the homepage prompt, instruction-link navigation, discovery metadata, and configured public page on desktop and mobile. No horizontal overflow at a 390-pixel mobile viewport.
- All 85 unit tests and TypeScript checking passed. Changed source files pass Biome and `git diff --check` passes. Full lint is blocked by existing `public/ui-mockups/app.js` callback errors and formatting in that file and `styles.css`.
- No deployment or remote database was used. Production builds and remote provider workflows were not exercised.

## Integrate with the redesign PR

Apply the agent documentation and public instruction access to `codex/pongo-ui-redesign`, preserving its screenshots, route behavior, dependencies, and redesigned page structure. Add discovery metadata and the setup prompt to the redesigned About section. Verify full lint, type checking, unit tests, and Playwright before committing to PR #27. Leave the main checkout and disposable HTML mockups unchanged.

The integrated PR worktree passes full Biome lint/format, TypeScript, 103 unit tests, skill validation, local documentation links, and all 26 Playwright tests with the CI single-worker setting. A two-worker local run had transient layout/scroll failures; the complete single-worker run passed. Two pre-existing CSS specificity warnings remain non-failing. README public-file links now resolve at the application root, repository documentation links resolve on GitHub, and anchors remain local. The browser suite follows the setup skill link from the rendered README and verifies both public instruction URLs without unlocking admin routes.
