# Dependency upgrades for PR 27

Carry the main workspace's package.json, bun.lock, Biome configuration and dependency-update record into the UI PR. Refresh every direct runtime and development dependency to the npm latest release using a per-command zero minimum release age, preserving each existing exact/caret declaration style. Keep TypeScript's ^5.9.3 declaration and locked 5.9.3 compiler unchanged.

Review compatibility changes for Croner 11, Postgres 4, iron-session 9, Motion 14, Hook Form resolvers 7, React 19.3 and Next 16.4. Read the installed Next.js guides before source adjustments. Update the Biome schema while retaining the main workspace's existing formatting scope.

Verify a frozen lockfile installation, full lint/format, TypeScript, all unit and browser tests, the production build against an isolated SQLite database, authentication/session behavior, scheduler startup and database-adapter compatibility. Audit installed direct packages against the registry again before pushing. Commit these upgrades to the existing PR branch and wait for GitHub and Vercel checks on that commit.

## Verified result

Updated 63 direct dependency declarations. Bun's fresh audit with `--minimum-release-age 0` reports only TypeScript as outdated; its declaration remains `^5.9.3` and the lockfile/compiler remain `5.9.3`. The upgrade includes Next 16.4.4, React/React DOM 19.3.1, Croner 11.0.0, Postgres 4.0.0, iron-session 9.0.1, Motion 14.9.0 and Hook Form resolvers 7.0.1.

Frozen installation, TypeScript, 101 unit tests, 25 Playwright tests and the production build passed. The build ran migrations only against an isolated SQLite database. Croner accepted both the application's protected cron pattern and protected interval configuration. Postgres 4 passed a transaction with a temporary-table write/read through the application's Drizzle adapter; the table was scoped to that transaction and left no application data behind.

No application source migration was required. Biome's schema was updated to 2.6.4, retaining the main workspace's disabled Markdown/YAML formatting. Full repository lint passes with two non-blocking specificity warnings on existing CSS selectors.

The main workspace package.json, bun.lock and Biome configuration were synchronized with this upgrade after checking that their original inputs had not changed concurrently. Its frozen install, type check and 85 unit tests also passed; unrelated workspace files were preserved.
