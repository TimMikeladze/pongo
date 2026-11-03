# Pongo UI mockups

Build four disposable HTML screens under `public/ui-mockups/`: public status, incident history, maintenance, and operator overview. Shared CSS and browser JavaScript keep these reviewable without changing Pongo's React application. The user confirmed both public and internal views.

The supplied Better Stack screenshots establish a useful public-page hierarchy: named services, current health, 90-day uptime and persistent navigation. Improve their oversized whitespace, repeated empty month containers, color-only history, and incident summaries that hide impact and duration.

Pongo review: the overview renders six charts before monitor triage; labels frequently use 10px text; public DashboardView also renders per-monitor latency/error charts, SLA and announcements. The empty local database renders 100% uptime and 0ms alongside degraded status. MaintenanceSchedule already omits itself when empty. Keep file-based configuration, RSS/Atom, monitor details, alerting and public dashboards as product truth.

Direction: retain Pongo branding and a dark neutral operational surface, with a light theme for daylight use. Public pages answer “is my service affected?” before exposing historical performance. Internal overview prioritizes an actionable problem row and a sortable, searchable service table. Use readable 14px text, uniform borders, aligned numeric columns, status words as well as color, and progressive disclosure.

All example telemetry, incidents, timestamps and maintenance windows are synthetic and labeled in the prototype toolbar. Controls demonstrate local UI behavior only. No subscriptions, monitor execution, deployment, or configuration writes occur.

Implementation: one HTML entry per screen; shared CSS; shared JavaScript for rendering, theme, example-state selection, range filtering, service history details, incident expansion, maintenance states, monitor search/sort, and chart disclosure. Preserve existing application and any concurrent dependency work.

Verification: start Pongo, inspect current public/internal surfaces in the browser, render all mockups at desktop and 390px mobile, exercise their primary controls, check missing assets and JS errors, and run the design detector. Static mockups do not need application unit tests.
