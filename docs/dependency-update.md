# Dependency update

This records the original main-workspace upgrade. The combined PR refresh and final verification are recorded in [dependency-upgrades.md](dependency-upgrades.md).

Update every dependency and development dependency in the root `package.json` to the latest stable release allowed by Bun's configured minimum release age. Keep the TypeScript declaration (`^5.9.3`) and locked compiler (`5.9.3`) unchanged.

- [x] Install the existing lockfile and run baseline unit tests and type checking.
- [x] Run `bun update --latest '!typescript'`, regenerate `bun.lock`, and adjust configuration or source only where an upgrade requires it.
- [x] Run unit tests, TypeScript, lint, a production build with a temporary SQLite database, and the existing Playwright smoke tests. Confirm only TypeScript remains outdated and review the diff.

Use the existing checkout and test suites. Do not run migrations against the configured application database. Record any compatibility changes and verification limitations here.

Biome 2.6 adds Markdown and YAML formatting. Update its schema version and disable those new formatters to preserve the existing formatting scope. The initial lint run after the upgrade reported seven formatting errors in existing Markdown and YAML files; unit tests and TypeScript passed.

Updated 61 dependency declarations and their transitive dependencies. Frozen installation succeeds, all 84 unit tests pass, TypeScript 5.9.3 passes, lint passes, and Next.js 16.4.3 builds successfully against a temporary SQLite database. Only TypeScript differs from Bun's age-eligible latest direct dependency versions.

All three existing Playwright smoke tests pass against the production build using a temporary configuration outside the repository. The regular Playwright command could not start its development server because another server already owned this checkout's development lock. That existing server was left running.

The build emits Next.js warnings about the existing Edge Runtime image routes and their lack of static generation. No application source changes were needed.
