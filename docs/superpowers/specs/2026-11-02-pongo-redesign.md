# Pongo interface redesign

Recreate the approved HTML mockups across the entire application, with less vertical whitespace and the same width on every page. The user approved the visual direction, requested consistent widths, then authorized the denser full-site implementation and a PR.

Keep Pongo's actual data, configuration-as-code, authentication, range selection, monitor execution controls, alerts, dashboards, incidents, announcements, maintenance, region views, charts, branding overrides and feeds. Do not ship synthetic mockup telemetry or change scheduler/database contracts. Existing charts may keep their current library; this work introduces no new chart library.

The visual reference is the approved status, incidents, maintenance and operator HTML mockups from the design review. Preserve their neutral surfaces, system sans typography, restrained green/amber/red status vocabulary, shared navigation, compact incident summaries and task-first operator layout. Monospace is reserved for measurement and code.

Use one 1120px maximum content width and 20px desktop / 16px mobile gutters for header, main and footer. Dense default: 48px header, 40px footer, 16px section separation, 8–12px table/service row padding and 20–24px history bars. Body text is 14px; supporting labels should normally be at least 12px. Keep 32px buttons and inputs (28px shell controls, 44px on touch) and accessible names/focus. Preserve the optional full-width and zen controls, applied consistently to the whole shell. Reserve scrollbar space so routes do not move sideways. No decorative rails, dotted background or glow effects.

## Page coverage

Existing page routes (14): `/`; `/monitors`; `/monitors/[id]`; `/dashboards`; `/dashboards/[id]`; `/dashboards/[id]/incidents`; `/dashboards/[id]/announcements`; `/alerts`; `/settings`; `/settings/notifications`; `/login`; `/shared/[slug]`; `/shared/[slug]/incidents`; `/shared/[slug]/announcements`. Also add `/shared/[slug]/maintenance` to make the mockup's maintenance view work with existing maintenance data. Refresh not-found/error/loading presentations where used. Keep API, RSS, Atom and image routes functional.

Public pages need a visible brand/header, persistent Status/Incidents/Maintenance/Updates navigation, feed access and a status-first hierarchy. Availability bars are inspectable by keyboard and pointer. Public charts move behind a performance disclosure; do not remove them. Incidents expose impact, duration, date and state before expansion. Maintenance uses one informative empty state, not repeated empty months.

Internal pages use an actionable health/alert summary, compact aligned metrics and a searchable/sortable monitor table before detailed charts. Detail pages retain all existing performance, incident, region, manual-run and alert actions. Settings must describe supported notification configuration truthfully; do not invent email/SMS setup or link to missing routes. Login retains access-code validation, errors, busy states and session behavior.

Unknown measurements display an em dash or “Awaiting first check”, never 100% availability or 0ms masquerading as measurements. Compute health independently of historical aggregation: down > degraded > pending > up, with an empty monitor list pending. Paused monitors must not appear down or healthy through missing results.

## Shared interfaces and ownership

Root owns shell, tokens, root overview, shared layout primitives, health helpers, monitor table and global controls. Public/dashboard worker owns all dashboard and shared routes, dashboard-view, public dashboard index, uptime displays, SLA, incidents/announcements/maintenance components. Operator worker owns monitor routes/detail, alerts routes/components, settings and login. Workers do not edit shared shell/CSS or each other's files; describe needed changes instead.

`@/components/page-layout`: PageHeading({title, description?, actions?, back?:{href,label}}); SectionHeading({title, description?, actions?}); EmptyState({title,description?,children?}); MetricStrip({children}). All render semantic markup with shared CSS classes; no nested width containers.

`@/lib/health`: summarizeHealth(statuses: Array<MonitorStatus | null | undefined>): MonitorStatus, with precedence above. healthLabels: Record<MonitorStatus,string>.

`@/components/monitor-table`: async MonitorTable({monitors: Monitor[], timeRange: TimeRange, showFilters?: boolean}). Links to real monitor detail routes; URL-backed search/status filtering and local sorting; compact responsive rows; unknown stats when check count is zero. Parent root creates this component.

## Acceptance evidence

Tests cover health precedence, unknown measurement handling, route authentication, every real page, consistent shell width, functional navigation, filters, incident disclosure, range controls, theme, density, fullscreen and alerts where fixture data supports them. Capture real pages at 1440px and 390px plus a tablet width, inspect both themes and no-data/degraded states. Run formatting/lint, tsc, unit suite, e2e and production build. Independently review the full diff and rendered screenshots; fix material findings. Open a PR to main and wait for CI. Preserve unrelated dependency changes in the original checkout.
