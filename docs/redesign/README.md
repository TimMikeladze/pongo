# Pongo interface redesign

The implementation follows the approved HTML mockups from the design review and the denser full-site brief in [the implementation spec](../superpowers/specs/2026-11-02-pongo-redesign.md). [DESIGN.md](../../DESIGN.md) records the implemented visual system; [PRODUCT.md](../../PRODUCT.md) records product behavior and constraints. The schema-version-2 [design sidecar](../../.impeccable/design.json) contains component previews and extension metadata.

## Route inventory

All 14 existing page routes use the shared shell. Public maintenance is the fifteenth page, backed by the existing maintenance provider.

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

Shared pages retain Status, Incidents, Maintenance and Updates navigation, branding, and feed access. RSS, Atom, status JSON and image/API routes remain functional. Missing shared slugs use the not-found presentation.

## Behavior preserved

Current health follows outage, degraded, pending, then operational precedence. Historical measurement helpers preserve unknown values rather than presenting synthetic uptime or latency; an empty monitor set stays pending. Public history supports pointer inspection, a single keyboard tab stop, arrow keys, Home and End. Paused monitors retain their label.

The footer’s Page options retains view controls, documentation, support and authentication actions with visible labels. The Support dialog scrolls internally on short screens; collapsed sharing controls are inert. Mobile alert rows keep state and actions visible without horizontal scrolling.

The shell applies the same width to every route and preserves theme, dense/zen and full-width controls. Preferences restore after hydration to keep server markup and controlled inputs consistent. Zen mode keeps a visible exit control, and chart dialogs restore focus after closing. Existing monitor execution, alert actions, range selection, dashboard content, feeds and authentication remain connected to application data and configuration.

## Verification record

Local verification passed 96 unit tests, 16 end-to-end tests, lint, typecheck and a production build. Independent code and visual reviews approved the implementation after all three material findings were fixed. CI status is recorded on the PR.

| Evidence | Coverage |
| --- | --- |
| `bun test src` | 96 unit tests, including health precedence and unknown measurements |
| `bunx playwright test` | 16 tests across smoke and redesign suites |
| `tests/e2e/redesign.spec.ts` | All 15 pages at 390px, 768px and 1440px; aligned shell width and no page overflow |
| Redesign interaction tests | Public access/feeds, search and empty states, themes, width, zen recovery, chart focus restoration, history keyboard and touch controls, dashboard filter navigation, short-screen dialogs and range changes |
| Production build | Completed against an isolated database during verification |

The unit and browser tests are source-controlled. Browser tests use their isolated SQLite database and test access code from `playwright.config.ts`. Select a free `E2E_PORT` when the default test port is occupied; do not stop an existing application to run the suite.

## Screenshots and fixtures

Local review captures are in `.impeccable/review/`, which is ignored by Git. `capture-report.json` records desktop and mobile route geometry with no overflow failures; captures include both themes and expanded alert state. The tablet width is covered by the end-to-end route checks. The capture fixture supplies synthetic monitoring history only to an isolated review database; it is separate from production data and the normal configuration.

Production pages continue reading configured monitors, dashboard definitions, incident/announcement content and stored check results. Do not copy review telemetry into runtime configuration or commit the full screenshot directory. Retain only a specifically requested review artifact when a later review needs a tracked image.

History bars combine long ranges into at most 90 contiguous display periods. Tooltips retain the underlying date bounds, measured checks, weighted availability and missing intervals. The sparkline keeps every selected aggregation interval. This prevents narrow-screen histories from collapsing to zero width.

Monitor search and status filters are stored in the URL with shallow updates, so reload, sharing and back/forward navigation preserve the visible selection. Long dashboard labels truncate within the header; their full text remains available to assistive technology and the native title tooltip.

The maintenance provider currently returns no windows, so the maintenance page shows its empty state. This redesign does not add a maintenance storage or scheduling backend.

Dashboard search and visibility filters use URL-backed state and server filtering. Empty Updates sections are omitted from overview pages; the dedicated Updates route remains available. Mobile history inspection provides a period slider and large Previous/Next controls.
