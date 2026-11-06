# Pongo UI mockups

These HTML studies preceded the React redesign. With Pongo running, open `/ui-mockups/index.html` for the public preview or `/ui-mockups/overview.html` for the operator preview. The links below use the original review port, 4317; substitute your development server’s port.

The HTML lives in `public/ui-mockups/`. It is independent of React and can also be served with any static file server. All measurements, service configuration, incident records and maintenance windows are illustrative. Theme preference is the only persisted setting. Check and silence buttons simulate feedback locally.

| Screen | Open | Change from the current UI |
| --- | --- | --- |
| Public status | [index.html](http://localhost:4317/ui-mockups/index.html) | Current health before telemetry; named services and selectable 7/30/90-day history; explicit unknown state. |
| Incident history | [incidents.html](http://localhost:4317/ui-mockups/incidents.html) | Impact, duration and UTC timestamps visible before expansion; service, date and text filters. |
| Maintenance | [maintenance.html](http://localhost:4317/ui-mockups/maintenance.html) | One empty upcoming state; scheduled work shows expected impact and a calendar download. |
| Operator overview | [overview.html](http://localhost:4317/ui-mockups/overview.html) | Firing alerts and affected monitors first; searchable/sortable rows; performance chart disclosed on demand. |

Use the example selector on status and overview to compare healthy, incident and no-data states. Maintenance has an empty/scheduled selector. The theme button switches light and dark. History supports left/right arrows and Home/End; each service contributes one tab stop.

All screens use the same `--content-width: 1120px` and `--page-gutter` values in `styles.css`. Headers, main content and footers align. Gutters are 32px on desktop and 18px at widths of 700px or less. A reserved scrollbar gutter prevents horizontal movement between short and long pages. There are no page-specific content-width overrides.

## Findings behind the mockups

Pongo's public page currently reuses `DashboardView`, which includes announcement, SLA, response-time and error-rate sections. The local empty database shows “degraded” alongside “100%” and “0ms”. Current health, history and missing measurements need separate representations. The HTML demonstrates that distinction; it does not change production data handling.

The internal overview puts six charts before the monitor list. The operator mockup brings the problem service and firing alert into the first screen, with the remaining telemetry available below. Configuration remains in TypeScript files; the preview does not introduce an in-app monitor editor.

The supplied Better Stack screenshots make current status and service history clear. Their incident view requires extensive scrolling, and the maintenance view repeats large empty month cards. The mockups retain persistent status/incident/maintenance navigation and compress those histories.

## Verification

Browser captures are in `screenshots/`; the recorded interaction checks are in `verification.json`. The browser checks cover all four screens at 320, 390, 768, 1440 and 1833px, matching content/header/footer widths, missing assets, JavaScript errors, light/dark mode, history keyboard access, filters, disclosures, maintenance feeds/calendar and all example states.

The Impeccable detector initially flagged the skip-link hover contrast; its hover text now uses the action foreground. A separate visual reviewer inspected the four primary screens and the light/no-data/incident variants. Production tests and type-checking were not run: these files do not change the React application. Existing dependency edits in the working tree are outside this work.

`logo.png` is copied from the existing Pongo public asset. The preview uses system fonts and authored inline SVG icons, with no external asset requests.

## Preserve the design study in the redesign PR

The original HTML, local assets and review captures are committed with the redesigned application. JavaScript and CSS are formatted with Biome; callbacks used for DOM updates have statement bodies. These files remain illustrative design studies. The React interface uses the shared shadcn components described in [the redesign notes](../redesign/README.md).
