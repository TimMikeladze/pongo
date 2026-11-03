# Pongo interface redesign

The implementation follows the approved HTML mockups from the design review and the denser full-site brief in [the implementation spec](../superpowers/specs/2026-11-02-pongo-redesign.md). [DESIGN.md](../../DESIGN.md) records the implemented visual system; [PRODUCT.md](../../PRODUCT.md) records product behavior and constraints. The schema-version-2 [design sidecar](../../.impeccable/design.json) contains component previews and extension metadata.

## Route inventory

All 14 original page routes use the shared shell. Public maintenance adds a fifteenth page, backed by the existing maintenance provider. The environment-gated README is the sixteenth page.

| Route | Page |
| --- | --- |
| `/` | Overview with current health, compact metrics, monitor triage and disclosed performance |
| `/monitors` | Searchable, filterable and sortable monitor table |
| `/monitors/[id]` | Monitor detail, manual run, regions, performance and alerts |
| `/dashboards` | Configured dashboard index |
| `/dashboards/[id]` | Internal dashboard status and measurements |
| `/dashboards/[id]/incidents` | Dashboard incident history |
| `/dashboards/[id]/announcements` | Dashboard updates |
| `/alerts` | Alert rules, events and actions |
| `/settings` | Appearance and runtime configuration |
| `/settings/notifications` | Configured webhook channel guidance |
| `/login` | Access-code validation, errors and busy state |
| `/shared/[slug]` | Public status, inspectable history and disclosed performance |
| `/shared/[slug]/incidents` | Public incident history and disclosures |
| `/shared/[slug]/maintenance` | Public maintenance schedule |
| `/shared/[slug]/announcements` | Public updates |
| `/shared/[slug]/how-it-works` | README with highlighted code, enabled by `SHOW_HOW_IT_WORKS` |

Shared pages retain Status, Incidents, Maintenance and Updates navigation, branding, and feed access. RSS, Atom, status JSON and image/API routes remain functional. Missing shared slugs use the not-found presentation.

## Behavior preserved

Current health follows outage, degraded, pending, then operational precedence. Historical measurement helpers preserve unknown values rather than presenting synthetic uptime or latency; an empty monitor set stays pending. Public history supports pointer inspection, a single keyboard tab stop, arrow keys, Home and End. Paused monitors retain their label.

The footer’s Page options retains view controls, documentation, support and authentication actions with visible labels. The Support dialog scrolls internally on short screens; collapsed sharing controls are inert. Mobile alert rows keep state and actions visible without horizontal scrolling.

The shell applies the same width to every route and preserves theme, dense/zen and full-width controls. Preferences restore after hydration to keep server markup and controlled inputs consistent. Zen mode keeps a visible exit control, and chart dialogs restore focus after closing. Existing monitor execution, alert actions, range selection, dashboard content, feeds and authentication remain connected to application data and configuration.

## Verification record

Local verification passed 103 unit tests, 35 end-to-end tests, lint, typecheck and a production build. Independent code and visual reviews approved the implementation after all three material findings were fixed. CI status is recorded on the PR.

| Evidence | Coverage |
| --- | --- |
| `bun test src` | 103 unit tests, including health precedence and unknown measurements |
| `bunx playwright test` | 35 tests across smoke and redesign suites |
| `tests/e2e/redesign.spec.ts` | All 16 pages at 390px, 768px and 1440px; aligned shell width and no page overflow |
| Redesign interaction tests | Public access/feeds, search and empty states, themes, width, zen recovery, chart focus restoration, history keyboard and touch controls, dashboard filter navigation, short-screen dialogs and range changes |
| Production build | Completed against an isolated database during verification |

The unit and browser tests are source-controlled. Browser tests use their isolated SQLite database and test access code from `playwright.config.ts`. The test configuration loads the same local environment files as Next.js, so branding expectations match the running app. Select a free `E2E_PORT` when the default test port is occupied; do not stop an existing application to run the suite.

## Screenshots and fixtures

Local review captures are in `.impeccable/review/`, which is ignored by Git. `capture-report.json` records desktop and mobile route geometry with no overflow failures; captures include both themes and expanded alert state. The tablet width is covered by the end-to-end route checks. Width expectations use the body’s available inline width, accounting for reserved scrollbar gutters on Linux and overlay scrollbars on macOS. The capture fixture supplies synthetic monitoring history only to an isolated review database; it is separate from production data and the normal configuration.

Production pages continue reading configured monitors, dashboard definitions, incident/announcement content and stored check results. Do not copy review telemetry into runtime configuration or commit the full screenshot directory. Retain only a specifically requested review artifact when a later review needs a tracked image.

History bars combine long ranges into at most 90 contiguous display periods. Tooltips retain the underlying date bounds, measured checks, weighted availability and missing intervals. The sparkline keeps every selected aggregation interval. This prevents narrow-screen histories from collapsing to zero width.

Monitor search, status filters and sorting are stored in the URL with shallow updates, so reload, sharing and back/forward navigation preserve the visible selection. Long site names and deployment captions truncate within the header; their full text remains available to assistive technology and the native title tooltip.

The maintenance provider currently returns no windows, so the maintenance page shows its empty state. This redesign does not add a maintenance storage or scheduling backend.

Dashboard search and visibility filters use URL-backed state and server filtering. Empty Updates sections are omitted from overview pages; the dedicated Updates route remains available. Mobile history inspection provides a period slider and large Previous/Next controls.

The header defaults to `pongo.sh` with `Demo deployment` beneath it. `NEXT_PUBLIC_HEADER_CAPTION` changes the secondary line. Set `NEXT_PUBLIC_GITHUB_URL` to show a direct footer repository link; leaving it unset omits the link. `NEXT_PUBLIC_HIDE_GITHUB=true` hides a configured link. These options are documented in `.env.example`.

The local Next.js development indicator is disabled so it does not cover footer actions on narrow screens.

Geist is the shared interface and chart font; Geist Mono is reserved for code and existing monospaced data. Both are served locally by Next.js. Service history labels availability and response time separately, provides named History/Trend controls, and uses a fixed 0–100% trend scale. Missing periods stay disconnected. Chart icons are centered with selected and keyboard focus states.

The footer caption links to `NEXT_PUBLIC_GITHUB_URL`, falling back to `https://github.com/TimMikeladze/pongo`. Operator pages use one header divider. Monitor filters have 16px of space before the table. README screenshots are saved under `public/readme/` and show illustrative local review data.

The header, public tabs and footer stay visible while main content scrolls. Navigation to a different page resets main scroll; reporting-range changes preserve it. Zen mode still hides the shell and keeps its recovery controls. `SHOW_HOW_IT_WORKS` gates the public README page and tab: development defaults on and production defaults off, with explicit `true` or `false` overriding either. The README is included in the serverless trace; its screenshots are served from `public/readme/`.

README code uses Shiki syntax highlighting with high-contrast palettes for both themes. Long lines wrap inside code blocks. Main content and navigation retain scrolling without visible scrollbar tracks. The README route returns 404 when disabled, including direct requests.

The dependency refresh is part of this PR: [upgrade record](../dependency-upgrades.md). All direct packages use the latest audited releases except TypeScript, which remains at 5.9.3. The update includes the original main-workspace package, lockfile and Biome changes.

Prompt-based setup is included in this PR. The [agent setup guide](../agent-setup.md) documents the copyable pongo.sh prompt, follow-up questions, and optional skill installation. `/llms.txt` and `/skills/create-pongo/SKILL.md` are public even when admin login is enabled. The README, redesigned About section, and HTML discovery link point agents to those instructions. Relative README links to public files resolve at the site root; repository documentation links resolve on GitHub. Regression tests verify those links and public access.

Shared controls now use the existing shadcn/ui library: buttons and action links, search fields, themed selectors, single-choice groups, tables, status badges, disclosures and the mobile history slider. Monitor sorting and appearance menus render within the page theme. Single-choice groups expose radio semantics with arrow-key navigation; filters retain their URL state. See [the control migration record](shadcn-controls.md).

Monitor and dashboard search share the shadcn InputGroup field, a reserved clear button and Escape-to-clear behavior. Clearing keeps the active filter and restores input focus. Touch actions, selectors and menu items have 44px targets; calendar dates and history bars keep their compact grids. See [search and touch verification](search-and-touch.md).

The original mockups and their review captures are retained in `public/ui-mockups/` and `docs/ui-mockups/`. Consolidating them into the PR adds nine non-failing CSS specificity warnings from the original study styles; application CSS retains its two existing warnings. All 35 browser tests pass with the CI single-worker setting.
