/* Disposable UI study. All telemetry and incident records below are synthetic. */
const page = document.body.dataset.page;
const state = {
  scenario: page === "overview" ? "incident" : "healthy",
  days: 90,
  search: "",
  service: "all",
  period: "90",
  sort: "status",
  filter: "all",
  maintenance: "none",
};
const app = document.querySelector("#app");
const snapshot = new Date("2026-11-02T16:41:00Z");
const iconPaths = {
  check: '<path d="m5 12 4 4L19 6"/>',
  circle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert:
    '<path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
  rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  refresh:
    '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 2M4 17l2 2a7 7 0 0 0 12-2"/>',
};
const icon = (name, extra = "") =>
  `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.circle}</svg>`;
const brand = (label = "System status") =>
  `<a class="brand" href="${page === "overview" ? "overview.html" : "index.html"}" aria-label="Pongo ${label}"><img src="logo.png" alt=""><span>pongo<span class="muted">.</span></span><span class="brand-divider"></span><span class="brand-label">${label}</span></a>`;
const themeButton = () =>
  `<button type="button" class="btn icon-only" data-action="theme" aria-label="Switch color theme" title="Switch light / dark theme">${icon("sun")}</button>`;
const pill = (status, label) =>
  `<span class="pill ${status}"><span class="dot"></span>${label || ({ up: "Operational", degraded: "Degraded", down: "Down", pending: "Awaiting check", scheduled: "Scheduled" })[status]}</span>`;
const services = [
  {
    id: "web",
    name: "Web application",
    file: "web-app.ts",
    latency: 142,
    interval: "60s",
    incidents: [
      { ago: 20, mins: 46, status: "degraded" },
      { ago: 64, mins: 17, status: "down" },
    ],
  },
  {
    id: "mobile",
    name: "Mobile API",
    file: "mobile-api.ts",
    latency: 186,
    interval: "60s",
    incidents: [
      { ago: 20, mins: 15, status: "degraded" },
      { ago: 49, mins: 22, status: "degraded" },
    ],
  },
  {
    id: "ingestion",
    name: "Data ingestion",
    file: "data-ingestion.ts",
    latency: 231,
    interval: "30s",
    incidents: [
      { ago: 20, mins: 15, status: "degraded" },
      { ago: 35, mins: 12, status: "down" },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    file: "notifications.ts",
    latency: 94,
    interval: "60s",
    incidents: [
      { ago: 19, mins: 38, status: "degraded" },
      { ago: 20, mins: 46, status: "degraded" },
      { ago: 64, mins: 31, status: "down" },
    ],
  },
  {
    id: "integrations",
    name: "Integrations API",
    file: "integrations-api.ts",
    latency: 118,
    interval: "60s",
    incidents: [],
  },
];
const incidentRecords = [
  {
    id: "alarms-38",
    date: "Oct 14",
    dateISO: "2026-10-14",
    title: "Notifications delayed by up to 38 minutes",
    impact: "Notifications",
    ids: ["notifications"],
    duration: "38 min",
    time: "01:37–02:15 UTC",
    resolved: "02:15",
    started: "01:37",
    ago: 19,
    resolution:
      "The delivery queue is clear. Notifications are being delivered on time.",
    message:
      "Some notifications are delayed by up to 38 minutes. Previously queued messages will still be delivered.",
  },
  {
    id: "data-15",
    date: "Oct 13",
    dateISO: "2026-10-13",
    title: "Device data delayed by up to 15 minutes",
    impact: "Data ingestion · Mobile API",
    ids: ["ingestion", "mobile"],
    duration: "15 min",
    time: "17:59–18:14 UTC",
    resolved: "18:14",
    started: "17:59",
    ago: 20,
    resolution:
      "Ingestion has caught up. Device readings and the mobile API are current.",
    message:
      "Recent device readings may be up to 15 minutes behind. Historical data remains available.",
  },
  {
    id: "charts-46",
    date: "Oct 13",
    dateISO: "2026-10-13",
    title: "Charts and notifications delayed",
    impact: "Web application · Notifications",
    ids: ["web", "notifications"],
    duration: "46 min",
    time: "14:25–15:11 UTC",
    resolved: "15:11",
    started: "14:25",
    ago: 20,
    resolution:
      "Chart refreshes and notification delivery have returned to normal.",
    message:
      "Charts may show older readings. Notifications are delayed by up to 46 minutes.",
  },
];
function serviceStatus(service) {
  if (state.scenario === "pending") return "pending";
  return state.scenario === "incident" && service.id === "ingestion"
    ? "degraded"
    : "up";
}
function dayRecord(service, index, days = state.days) {
  const ago = days - index - 1;
  const issue = service.incidents.find((event) => event.ago === ago);
  const date = new Date(snapshot);
  date.setUTCDate(date.getUTCDate() - ago);
  const active = ago === 0 && serviceStatus(service) === "degraded";
  const status =
    state.scenario === "pending"
      ? "pending"
      : active
        ? "degraded"
        : issue?.status || "up";
  return {
    ago,
    date,
    issue,
    status,
    label: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}
function uptime(service, days = state.days) {
  if (state.scenario === "pending") return "—";
  const affected =
    service.incidents
      .filter((event) => event.ago < days)
      .reduce((sum, event) => sum + event.mins, 0) +
    (serviceStatus(service) === "degraded" ? 26 : 0);
  return `${(100 * (1 - affected / (days * 1440))).toFixed(3)}%`;
}
function preview() {
  const scenarioControl = ["status", "overview"].includes(page)
    ? `<label class="preview-label" for="scenario">Example <select id="scenario" aria-label="Example state"><option value="healthy" ${state.scenario === "healthy" ? "selected" : ""}>All operational</option><option value="incident" ${state.scenario === "incident" ? "selected" : ""}>Active incident</option><option value="pending" ${state.scenario === "pending" ? "selected" : ""}>No check data</option></select></label>`
    : "";
  return `<div class="preview"><div class="preview-label">${icon("code")}<strong>UI study</strong><span>Illustrative data · Nov 2, 2026</span></div><div class="preview-actions"><a href="index.html" ${page !== "overview" ? 'aria-current="page"' : ""}>Public view</a><a href="overview.html" ${page === "overview" ? 'aria-current="page"' : ""}>Operator view</a>${scenarioControl}</div></div>`;
}
function publicHeader() {
  return `<div class="wrap"><header class="public-header">${brand()}<div class="header-actions">${themeButton()}<button type="button" class="btn" data-action="subscribe" aria-label="Get updates" aria-expanded="false" aria-controls="subscribe">${icon("rss")}<span class="subscribe-label">Get updates</span></button></div></header><nav class="public-nav" aria-label="Status page"><a href="index.html" ${page === "status" ? 'aria-current="page"' : ""}>Status</a><a href="incidents.html" ${page === "incidents" ? 'aria-current="page"' : ""}>Incidents</a><a href="maintenance.html" ${page === "maintenance" ? 'aria-current="page"' : ""}>Maintenance</a></nav><section id="subscribe" class="subscribe-panel" aria-label="Get status updates" hidden><h2>Follow service updates</h2><p>Subscribe in your feed reader. No account required.</p><div class="cluster"><a class="btn" href="feed.xml">${icon("rss")}RSS feed</a><a class="btn" href="feed.atom">${icon("rss")}Atom feed</a><span class="small muted">Preview feeds contain example incidents.</span></div></section></div>`;
}
function footer(operator = false) {
  return `<footer class="footer ${operator ? "" : "wrap"}"><div class="row"><div class="cluster">${brand("")}<span>Open-source uptime monitoring</span></div><div class="cluster"><span>Times shown in UTC</span><a href="feed.xml" class="text-link">${icon("rss")}RSS</a><a href="${operator ? "index.html" : "overview.html"}" class="text-link">${operator ? "Public status" : "Operator preview"}${icon("arrow")}</a></div></div></footer>`;
}
function notes(text) {
  return `<aside class="review-note"><strong>Design note.</strong> ${text}</aside>`;
}
function health() {
  const incident = state.scenario === "incident";
  const pending = state.scenario === "pending";
  return `<section class="health ${incident ? "warning" : pending ? "pending" : ""}" aria-label="Current system status"><div class="health-symbol">${icon(incident ? "alert" : pending ? "clock" : "check")}</div><div><h1>${incident ? "Data ingestion is delayed" : pending ? "Awaiting the first checks" : "All systems operational"}</h1><p>${incident ? "1 of 5 services affected. All other services are operational." : pending ? "5 services configured. Availability is not available yet." : "All 5 services are running normally."}</p></div><div class="snapshot">Snapshot · Nov 2, 2026<br><span class="mono">16:41 UTC</span></div></section>`;
}
function rangeControl() {
  return `<div class="segmented" role="group" aria-label="Service history period">${[7, 30, 90].map((days) => `<button type="button" data-range="${days}" aria-pressed="${state.days === days}">${days}d</button>`).join("")}</div>`;
}
function serviceRows() {
  return services
    .map((service) => {
      const status = serviceStatus(service);
      return `<article class="service"><div class="service-top"><div class="service-name">${icon(status === "up" ? "circle" : status === "degraded" ? "alert" : "clock", status === "degraded" ? "amber" : status === "pending" ? "muted" : "")}<h3>${service.name}</h3></div><div class="service-metrics"><span class="mono" title="Time without a recorded disruption over the selected period">${uptime(service)}</span>${pill(status)}</div></div><div class="history" style="--days:${state.days}" role="group" aria-label="${service.name}, ${state.days} days of history">${Array.from(
        { length: state.days },
        (_, index) => {
          const day = dayRecord(service, index);
          const label = `${day.label}: ${day.status === "pending" ? "No check data" : day.status === "up" ? "Operational" : `${day.status === "down" ? "Outage" : "Degraded service"}, ${day.issue?.mins || 26} minutes${!day.issue ? ", ongoing" : ""}`}`;
          return `<button type="button" class="${day.status}" data-day="${index}" data-service="${service.id}" tabindex="${index === state.days - 1 ? 0 : -1}" aria-pressed="false" aria-label="${label}" title="${label}"></button>`;
        },
      ).join(
        "",
      )}</div><div class="date-labels"><span>${dayRecord(service, 0).date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span><span>Nov 2 · Today</span></div><div class="history-detail" id="history-${service.id}" aria-live="polite" hidden></div></article>`;
    })
    .join("");
}
function recent() {
  return `<section class="section"><div class="section-heading"><h2>Recent incidents</h2><a class="text-link" href="incidents.html">View history${icon("right")}</a></div><div class="recent">${incidentRecords
    .slice(0, 2)
    .map(
      (record) =>
        `<a href="incidents.html#${record.id}"><time class="date" datetime="${record.dateISO}">${record.date}</time><div class="description"><h3>${record.title}</h3><p>${record.impact} · ${record.duration}</p></div>${pill("up", "Resolved")}${icon("right")}</a>`,
    )
    .join("")}</div></section>`;
}
function statusPage() {
  return `${health()}${state.scenario === "incident" ? `<div class="notice warning" style="margin-bottom:28px">${icon("alert", "notice-icon")}<div class="copy"><h3>New device readings may arrive late</h3><p>Investigating since 16:15 UTC. Historical readings remain available.</p></div><a class="text-link" href="incidents.html#active-ingestion">View incident${icon("right")}</a></div>` : ""}<section aria-labelledby="services-heading"><div class="section-heading"><div><h2 id="services-heading">Service availability</h2><p class="range-caption">${state.days}-day history · select a day for details</p></div>${rangeControl()}</div><div class="panel"><div class="row services-header"><span class="small muted">Production</span><span class="small muted">${state.scenario === "pending" ? "No measurements yet" : "Availability over selected period"}</span></div><div id="service-rows">${serviceRows()}</div></div><div class="legend"><span><i class="swatch"></i>Operational</span><span><i class="swatch warning"></i>Degraded</span><span><i class="swatch danger"></i>Outage</span><span><i class="swatch unknown"></i>No data</span><span>Each bar shows the day's worst state.</span></div></section>${recent()}${notes("Current health comes first. History has a fixed date range, status labels and inspectable days. Response-time charts stay in the operator view; visitors can find service impact without scanning telemetry.")}`;
}
function incidentItem(record, open = false) {
  return `<details class="incident" id="${record.id}" ${open ? "open" : ""}><summary><time class="incident-date" datetime="${record.dateISO}">${record.date}</time><div><h3>${record.title}</h3><p>${record.impact} · ${record.duration} · ${record.time}</p></div>${pill("up", "Resolved")}${icon("chevron", "chevron")}</summary><div class="incident-body"><div class="incident-impact"><span class="small muted">Affected services</span>${record.ids.map((id) => `<span class="pill">${services.find((s) => s.id === id).name}</span>`).join("")}</div><div class="update"><time>${record.resolved} UTC</time><div><strong class="green">Resolved</strong><p>${record.resolution}</p></div></div><div class="update"><time>${record.started} UTC</time><div><strong>Investigating</strong><p>${record.message}</p></div></div></div></details>`;
}
function activeIncident() {
  return `<details open class="incident" id="active-ingestion"><summary><time class="incident-date" datetime="2026-11-02">Nov 2</time><div><h3>Device readings delayed</h3><p>Data ingestion · Started 16:15 UTC · Ongoing</p></div>${pill("degraded", "Investigating")}${icon("chevron", "chevron")}</summary><div class="incident-body"><div class="incident-impact"><span class="pill">Data ingestion</span><span class="small muted">Other services remain operational</span></div><div class="update"><time>16:30 UTC</time><div><strong class="amber">Investigating</strong><p>We are investigating a growing ingestion backlog. New readings may arrive late; historical readings remain available. Next update by 17:00 UTC.</p></div></div><div class="update"><time>16:15 UTC</time><div><strong>Investigating</strong><p>We detected slower processing of new device readings.</p></div></div></div></details>`;
}
function incidentsPage() {
  return `<div class="page-heading"><h1>Incident history</h1><p>What happened, who was affected, and when it was resolved.</p></div><div class="toolbar"><label class="search">${icon("search")}<input id="incident-search" type="search" placeholder="Search incidents…" aria-label="Search incidents"></label><select id="incident-service" aria-label="Filter incidents by service"><option value="all">All services</option>${services.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select><select id="incident-period" aria-label="Incident history period"><option value="90">Last 90 days</option><option value="30">Last 30 days</option><option value="7">Last 7 days</option></select></div><div id="incident-list">${incidentList()}</div>${notes("Three resolved incidents fit on one screen. Each row exposes impact and duration; expand it for the full update history. Empty months collapse to one quiet line instead of repeating large containers.")}`;
}
function incidentList() {
  const visible = incidentRecords.filter(
    (r) =>
      (state.service === "all" || r.ids.includes(state.service)) &&
      r.ago < Number(state.period) &&
      `${r.title} ${r.impact}`
        .toLowerCase()
        .includes(state.search.toLowerCase()),
  );
  const includeActive =
    location.hash === "#active-ingestion" &&
    (state.service === "all" || state.service === "ingestion") &&
    `device readings delayed data ingestion`.includes(
      state.search.toLowerCase(),
    );
  return `${includeActive ? `<h2 class="month-heading">November 2026 <span>1 active incident</span></h2>${activeIncident()}` : `<div class="notice success">${icon("circle", "notice-icon")}<div class="copy"><h3>No incidents in November</h3><p>November 1–2, 2026 · All services operational</p></div></div>`}${visible.length ? `<h2 class="month-heading">October 2026 <span>${visible.length} resolved incident${visible.length === 1 ? "" : "s"}</span></h2><div>${visible.map((r) => incidentItem(r, location.hash === `#${r.id}`)).join("")}</div>` : `<div class="empty"><h2>No incidents match these filters</h2><p>Try another service, a wider date range, or clear your search.</p><button type="button" class="btn" data-action="reset-incidents">Clear filters</button></div>`}<p class="small muted" style="margin-top:20px">${state.period === "90" ? "No other incidents reported in this 90-day period." : `Showing the last ${state.period} days.`} All incident times are in UTC.</p>`;
}
function maintenancePage() {
  return `<div class="page-heading"><h1>Maintenance</h1><p>Planned work and what it means for your services.</p></div><div class="section-heading"><h2>Upcoming</h2><label class="cluster small muted" for="maintenance-example">Example<select id="maintenance-example" aria-label="Upcoming maintenance example"><option value="none">Nothing scheduled</option><option value="scheduled">Scheduled window</option></select></label></div><div id="maintenance-upcoming">${maintenanceUpcoming()}</div><section class="section"><div class="section-heading"><h2>Past maintenance</h2><span class="small muted">Last 90 days</span></div><details class="incident"><summary><time class="incident-date" datetime="2026-10-24">Oct 24</time><div><h3>Database index maintenance</h3><p>Data ingestion · 30 min · 05:00–05:30 UTC</p></div>${pill("up", "Completed")}${icon("chevron", "chevron")}</summary><div class="incident-body"><div class="update"><time>05:30 UTC</time><div><strong class="green">Completed</strong><p>Index maintenance finished. Device ingestion was available throughout the maintenance window.</p></div></div><div class="update"><time>05:00 UTC</time><div><strong>In progress</strong><p>Scheduled database index maintenance has started. No service interruption is expected.</p></div></div></div></details></section>${notes("A single empty state covers the entire upcoming schedule. Planned windows show expected impact, affected services, a timezone and a calendar download. Completed maintenance stays accessible below.")}`;
}
function maintenanceUpcoming() {
  if (state.maintenance === "none")
    return `<div class="panel empty"><div class="empty-icon">${icon("calendar")}</div><h2>No maintenance scheduled</h2><p>There are no upcoming maintenance windows. Follow the status feed for future announcements.</p><button type="button" class="btn" data-action="subscribe">${icon("rss")}Get maintenance updates</button></div>`;
  return `<article class="panel maintenance-window"><div class="row"><h2>Database storage upgrade</h2>${pill("scheduled")}</div><div class="schedule"><div>Date<strong>Sunday, November 8, 2026</strong></div><div>Window<strong class="mono">05:00–05:30 UTC</strong></div><div>Duration<strong>30 minutes</strong></div></div><p>New device readings may be delayed by up to 5 minutes during this window. Historical readings and all other services will remain available.</p><div class="row" style="flex-wrap:wrap;gap:16px"><div class="cluster"><span class="small muted">Affected service</span><span class="pill">Data ingestion</span></div><a class="btn" download="pongo-maintenance.ics" href="maintenance.ics">${icon("calendar")}Add to calendar</a></div></article>`;
}
function operatorHeader() {
  return `<header class="operator-header">${brand("Production")}<nav aria-label="Operator navigation"><a href="overview.html" aria-current="page">Overview</a><a href="#monitors">Monitors</a><a href="index.html">Status page${icon("arrow")}</a><a href="#attention">Alerts</a></nav><div class="header-actions">${themeButton()}<a class="btn" href="index.html">${icon("arrow")}<span>Public view</span></a></div></header>`;
}
function operatorPage() {
  const pending = state.scenario === "pending";
  const incident = state.scenario === "incident";
  return `<div class="page-heading"><div class="row"><h1>Overview</h1><div class="cluster"><select id="operator-period" aria-label="Operator reporting period"><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><button class="btn" type="button" data-action="configuration" aria-expanded="false" aria-controls="configuration">${icon("code")}Config</button></div></div><p>Production · 5 monitors · Snapshot at 16:41 UTC</p></div><section id="attention" aria-label="Monitor alerts">${incident ? `<div class="notice warning">${icon("alert", "notice-icon")}<div class="copy"><h3>Data ingestion needs attention</h3><p>Elevated response time for 26 minutes. 1 warning alert is firing.</p></div><button class="btn" data-action="investigate">Investigate${icon("right")}</button></div>` : pending ? `<div class="notice">${icon("clock", "notice-icon")}<div class="copy"><h3>Waiting for the first check results</h3><p>5 monitors are configured. Run the scheduler to start collecting measurements.</p></div><button class="btn" data-action="configuration">${icon("code")}View setup</button></div>` : `<div class="notice success">${icon("circle", "notice-icon")}<div class="copy"><h3>No monitors need attention</h3><p>All 5 services are operational. No alerts are firing.</p></div><a class="text-link" href="incidents.html">Incident history${icon("right")}</a></div>`}</section><section id="configuration" class="subscribe-panel" hidden><h2>Configuration stays in code</h2><p>These are example filenames for this UI study. Define monitors in <code>pongo/monitors/</code> and register them in <code>index.ts</code>.</p><div class="cluster"><code class="pill">bun scheduler</code><span class="small muted">Starts checks in a second terminal.</span></div><p class="small">Changes to monitor definitions are reviewed in git. This preview does not edit files or execute checks.</p></section><section class="stat-strip" aria-label="Monitoring summary"><div><div class="label">Availability</div><div class="value" id="stat-availability">${pending ? "—" : incident ? "99.639%" : "100%"}</div><div class="caption" id="stat-availability-caption">${pending ? "No check data" : "Last 24 hours"}</div></div><div><div class="label">Average response</div><div class="value" id="stat-response">${pending ? "—" : incident ? "488" : "154"}<span class="small">${pending ? "" : " ms"}</span></div><div class="caption" id="stat-response-caption">${pending ? "Not measured yet" : "Across all 5 monitors"}</div></div><div><div class="label">Operational monitors</div><div class="value">${pending ? "0" : incident ? "4" : "5"}<span class="muted"> / 5</span></div><div class="caption">${pending ? "5 awaiting first check" : incident ? "1 degraded · 0 down" : "0 degraded · 0 down"}</div></div><div><div class="label">Firing alerts</div><div class="value ${incident ? "amber" : ""}">${incident ? "1" : "0"}</div><div class="caption">${incident ? "Data ingestion · Warning" : pending ? "Awaiting evaluation" : "No action needed"}</div></div></section><section id="monitors" aria-labelledby="monitors-heading"><div class="section-heading"><h2 id="monitors-heading">Monitors <span class="muted small">5</span></h2><button class="btn quiet" data-action="check" ${pending ? "disabled" : ""}>${icon("refresh")}Preview check</button></div><div class="toolbar" style="margin-top:0"><label class="search">${icon("search")}<input type="search" id="monitor-search" aria-label="Search monitors" placeholder="Search monitors…"></label><div class="segmented" role="group" aria-label="Monitor filter"><button data-filter="all" aria-pressed="true">All <span class="muted">5</span></button><button data-filter="attention" aria-pressed="false">Needs attention <span class="muted">${incident ? "1" : "0"}</span></button></div><select id="monitor-sort" aria-label="Sort monitors"><option value="status">Status first</option><option value="name">Name A–Z</option><option value="latency">Slowest first</option></select></div><div class="table-wrap"><table><caption class="sr-only">Production monitors, current health and selected-period measurements</caption><thead><tr><th scope="col">Monitor</th><th scope="col">Status</th><th scope="col" class="number">Availability</th><th scope="col" class="number">Avg. response</th><th scope="col" class="number">Interval</th><th scope="col" class="number">Last check</th><th scope="col"><span class="sr-only">Details</span></th></tr></thead><tbody id="monitor-rows">${monitorRows()}</tbody></table></div><div class="table-bottom"><span id="monitor-count">Showing 5 monitors</span><span>Configuration in <code>pongo/monitors/</code></span></div></section><details class="performance" id="performance"><summary><h2>Performance</h2><span>Response times · expand to inspect ${icon("right")}</span></summary><div class="performance-content">${pending ? `<div class="panel empty"><h2>No measurements yet</h2><p>Charts appear after the scheduler records checks.</p></div>` : performanceChart()}</div></details><section class="section"><div class="section-heading"><h2>Recent activity</h2><a class="text-link" href="incidents.html">Incident history${icon("right")}</a></div><div class="recent">${incident ? `<a href="incidents.html#active-ingestion"><time class="date">16:15</time><div class="description"><h3>Data ingestion latency warning fired</h3><p>Response above 1,000 ms for 5 checks · us-east</p></div>${pill("degraded", "Firing")}${icon("right")}</a>` : ""}<a href="incidents.html#alarms-38"><time class="date">Oct 14</time><div class="description"><h3>Notification delays resolved</h3><p>38 minutes · Notifications</p></div>${pill("up", "Resolved")}${icon("right")}</a></div></section>${notes("Triage comes before charts: one actionable alert, aligned monitor rows, search and status sorting. The empty state never reports 100% uptime or 0 ms. Configuration remains file-driven; “Preview check” only simulates feedback in this mockup.")}`;
}
function monitorRows() {
  let list = services.filter(
    (service) =>
      `${service.name} ${service.file}`
        .toLowerCase()
        .includes(state.search.toLowerCase()) &&
      (state.filter !== "attention" || serviceStatus(service) === "degraded"),
  );
  list = [...list].sort((a, b) =>
    state.sort === "name"
      ? a.name.localeCompare(b.name)
      : state.sort === "latency"
        ? latency(b) - latency(a)
        : Number(serviceStatus(b) === "degraded") -
          Number(serviceStatus(a) === "degraded"),
  );
  if (!list.length)
    return `<tr><td colspan="7"><div class="empty"><h3>${state.filter === "attention" && !state.search ? "No monitors need attention" : "No monitors match your search"}</h3><p>${state.filter === "attention" ? "Try All to see the remaining monitors." : "Try a service name or configuration filename."}</p><button class="btn" data-action="reset-monitors">Clear filters</button></div></td></tr>`;
  return list
    .map((service) => {
      const status = serviceStatus(service);
      return `<tr class="${status === "degraded" ? "attention-row" : ""}"><td><button class="monitor-open" data-monitor="${service.id}" aria-expanded="false" aria-controls="detail-${service.id}"><div class="monitor-name">${service.name}</div><div class="monitor-file">${service.file}</div></button></td><td>${pill(status, status === "up" ? "Up" : undefined)}</td><td class="number" data-label="Availability">${uptime(service, state.operatorDays || 1)}</td><td class="number ${status === "degraded" ? "amber" : ""}" data-label="Avg. response">${status === "pending" ? "—" : `${latency(service)} ms`}</td><td class="number" data-label="Interval">${service.interval}</td><td class="number muted" data-label="Last check">${status === "pending" ? "Never" : "30s ago"}</td><td><button class="row-action" data-monitor="${service.id}" aria-label="Inspect ${service.name}" aria-expanded="false" aria-controls="detail-${service.id}">${icon("right")}</button></td></tr><tr hidden id="detail-${service.id}" class="monitor-detail-row"><td colspan="7" class="monitor-detail-cell"><div class="monitor-detail"><div class="row"><h3>${service.name}</h3><span class="small muted">Example configuration</span></div><div class="cluster"><code>pongo/monitors/${service.file}</code><span class="pill">${service.interval} interval</span><span class="pill">us-east</span></div><p>${status === "degraded" ? "Latency is above 1,000 ms for 5 consecutive checks. New readings may arrive late; existing readings are still available." : status === "pending" ? "This monitor has no recorded checks. Start the scheduler to collect measurements." : "The latest check passed. No alert conditions are currently firing."}</p>${status === "degraded" ? `<div class="cluster"><a class="btn" href="incidents.html#active-ingestion">View incident${icon("right")}</a><button class="btn" data-action="silence" aria-pressed="false">Silence preview alert for 1 hour</button></div>` : ""}</div></td></tr>`;
    })
    .join("");
}
function latency(service) {
  return serviceStatus(service) === "degraded" ? 1898 : service.latency;
}
function performanceChart() {
  const incident = state.scenario === "incident";
  const points = Array.from(
    { length: 85 },
    (_, i) =>
      `${42 + i * 10.7},${incident && i > 76 ? 110 - (i - 76) * 10 : 121 + Math.sin(i * 1.7) * 5 + Math.sin(i * 0.42) * 7}`,
  ).join(" ");
  return `<div class="chart"><div class="row"><h3>Average response time</h3><span class="small muted">${incident ? "Recent increase across monitored services" : "All 5 monitors · stable"}</span></div><svg viewBox="0 0 960 160" role="img" aria-label="Illustrative average response time chart, ${incident ? "rising during the active ingestion incident" : "stable over the selected period"}" preserveAspectRatio="none"><path class="chart-grid" d="M42 20H950M42 65H950M42 110H950M42 150H950"/><text x="0" y="24" class="chart-label">600</text><text x="0" y="69" class="chart-label">400</text><text x="0" y="114" class="chart-label">200</text><text x="0" y="154" class="chart-label">0 ms</text><polyline class="chart-line" points="${points}"/></svg><div class="chart-axis"><span id="chart-period-start">Yesterday · 16:41</span><span>Today · 16:41 UTC</span></div><p class="small muted" style="margin-top:14px">Illustrative trace. Open a monitor row for its current status and alert.</p></div>`;
}
function render() {
  const views = {
    status: statusPage,
    incidents: incidentsPage,
    maintenance: maintenancePage,
  };
  app.innerHTML = `${preview()}${page === "overview" ? `<div class="operator">${operatorHeader()}<main class="operator-main" id="main">${operatorPage()}</main>${footer(true)}</div>` : `${publicHeader()}<main class="wrap public-main" id="main">${views[page]()}</main>${footer()}`}<div class="toast" id="toast" role="status" hidden></div>`;
  updateThemeIcon();
}
function updateThemeIcon() {
  const button = document.querySelector('[data-action="theme"]');
  const light = document.documentElement.dataset.theme === "light";
  button.innerHTML = icon(light ? "moon" : "sun");
  button.setAttribute(
    "aria-label",
    `Switch to ${light ? "dark" : "light"} theme`,
  );
}
let toastTimer;
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 3800);
}
function refreshMonitors() {
  document.querySelector("#monitor-rows").innerHTML = monitorRows();
  const count = services.filter(
    (s) =>
      `${s.name} ${s.file}`
        .toLowerCase()
        .includes(state.search.toLowerCase()) &&
      (state.filter !== "attention" || serviceStatus(s) === "degraded"),
  ).length;
  document.querySelector("#monitor-count").textContent =
    `Showing ${count} of 5 monitors`;
}
function toggleMonitor(id, forceOpen = false) {
  const detail = document.getElementById(`detail-${id}`);
  if (!detail) return;
  const open = forceOpen || detail.hidden;
  detail.hidden = !open;
  document.querySelectorAll(`[data-monitor="${id}"]`).forEach((button) => {
    button.setAttribute("aria-expanded", String(open));
  });
  if (forceOpen)
    detail.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
document.addEventListener("click", (event) => {
  const target = event.target.closest("button, [data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "theme") {
    const theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("pongo-ui-study-theme", theme);
    } catch {}
    updateThemeIcon();
  }
  if (action === "subscribe") {
    const panel = document.querySelector("#subscribe");
    panel.hidden = !panel.hidden;
    document.querySelectorAll('[data-action="subscribe"]').forEach((button) => {
      button.setAttribute("aria-expanded", String(!panel.hidden));
    });
    if (!panel.hidden)
      panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  if (target.dataset.range) {
    state.days = Number(target.dataset.range);
    document.querySelectorAll("[data-range]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === target));
    });
    document.querySelector(".range-caption").textContent =
      `${state.days}-day history · select a day for details`;
    document.querySelector("#service-rows").innerHTML = serviceRows();
  }
  if (target.dataset.day !== undefined) {
    const service = services.find((s) => s.id === target.dataset.service);
    const day = dayRecord(service, Number(target.dataset.day));
    const detail = document.querySelector(`#history-${service.id}`);
    document
      .querySelectorAll(`[data-service="${service.id}"]`)
      .forEach((button) => {
        button.setAttribute("aria-pressed", String(button === target));
      });
    const message =
      day.status === "pending"
        ? "No checks recorded. Availability is unknown."
        : day.status === "up"
          ? "Operational for the recorded day."
          : `${day.issue?.mins || 26} minutes of ${day.status === "down" ? "outage" : "degraded service"}${!day.issue ? " so far · Incident ongoing" : ""}.`;
    detail.innerHTML = `<strong>${day.label}</strong><span class="muted">${message}</span>`;
    detail.hidden = false;
  }
  if (target.dataset.monitor) toggleMonitor(target.dataset.monitor);
  if (target.dataset.filter) {
    state.filter = target.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === target));
    });
    refreshMonitors();
  }
  if (action === "reset-monitors") {
    state.search = "";
    state.filter = "all";
    document.querySelector("#monitor-search").value = "";
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === "all"),
      );
    });
    refreshMonitors();
    document.querySelector("#monitor-search").focus();
  }
  if (action === "reset-incidents") {
    state.search = "";
    state.service = "all";
    state.period = "90";
    document.querySelector("#incident-search").value = "";
    document.querySelector("#incident-service").value = "all";
    document.querySelector("#incident-period").value = "90";
    document.querySelector("#incident-list").innerHTML = incidentList();
    document.querySelector("#incident-search").focus();
  }
  if (action === "configuration") {
    const panel = document.querySelector("#configuration");
    panel.hidden = !panel.hidden;
    document
      .querySelectorAll('[data-action="configuration"]')
      .forEach((button) => {
        button.setAttribute("aria-expanded", String(!panel.hidden));
      });
    if (!panel.hidden)
      panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  if (action === "investigate") {
    state.search = "";
    state.filter = "all";
    document.querySelector("#monitor-search").value = "";
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === "all"),
      );
    });
    refreshMonitors();
    toggleMonitor("ingestion", true);
    document
      .querySelector('[data-monitor="ingestion"]')
      .focus({ preventScroll: true });
  }
  if (action === "silence") {
    const silenced = target.getAttribute("aria-pressed") !== "true";
    target.setAttribute("aria-pressed", String(silenced));
    target.textContent = silenced
      ? "Resume preview notifications"
      : "Silence preview alert for 1 hour";
    toast(
      silenced
        ? "Preview alert silenced. No notification settings were changed."
        : "Preview notifications resumed.",
    );
  }
  if (action === "check") {
    target.disabled = true;
    target.innerHTML = `${icon("refresh")}Checking…`;
    setTimeout(() => {
      target.disabled = false;
      target.innerHTML = `${icon("refresh")}Preview check`;
      document.querySelectorAll('td[data-label="Last check"]').forEach((el) => {
        el.textContent = "Just now";
      });
      toast("Preview check complete. No monitor handlers were executed.");
    }, 650);
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "monitor-search") {
    state.search = event.target.value;
    refreshMonitors();
  }
  if (event.target.id === "incident-search") {
    state.search = event.target.value;
    document.querySelector("#incident-list").innerHTML = incidentList();
  }
});
document.addEventListener("change", (event) => {
  const { id, value } = event.target;
  if (id === "scenario") {
    state.scenario = value;
    state.search = "";
    state.filter = "all";
    state.operatorDays = 1;
    render();
  }
  if (id === "incident-service" || id === "incident-period") {
    state[id === "incident-service" ? "service" : "period"] = value;
    document.querySelector("#incident-list").innerHTML = incidentList();
  }
  if (id === "maintenance-example") {
    state.maintenance = value;
    document.querySelector("#maintenance-upcoming").innerHTML =
      maintenanceUpcoming();
  }
  if (id === "monitor-sort") {
    state.sort = value;
    refreshMonitors();
  }
  if (id === "operator-period") {
    state.operatorDays = Number(value);
    refreshMonitors();
    const days = Number(value);
    const avg =
      services.reduce((sum, s) => sum + parseFloat(uptime(s, days)), 0) /
      services.length;
    document.querySelector("#stat-availability").textContent =
      state.scenario === "pending" ? "—" : `${avg.toFixed(3)}%`;
    document.querySelector("#stat-availability-caption").textContent =
      state.scenario === "pending"
        ? "No check data"
        : days === 1
          ? "Last 24 hours"
          : `Last ${days} days`;
    const start = document.querySelector("#chart-period-start");
    if (start)
      start.textContent =
        days === 1 ? "Yesterday · 16:41" : `${days} days ago · 16:41`;
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.target.matches("[data-day]") &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    const buttons = [...event.target.parentElement.querySelectorAll("button")];
    const current = buttons.indexOf(event.target);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : Math.max(
              0,
              Math.min(
                buttons.length - 1,
                current + (event.key === "ArrowLeft" ? -1 : 1),
              ),
            );
    buttons.forEach((button, i) => {
      button.tabIndex = i === next ? 0 : -1;
    });
    buttons[next].focus();
    buttons[next].click();
  }
});
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("pongo-ui-study-theme") || "dark";
} catch {}
window.addEventListener("hashchange", () => {
  if (page === "incidents")
    document.querySelector("#incident-list").innerHTML = incidentList();
});
render();
if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.tagName === "DETAILS") target.open = true;
}
