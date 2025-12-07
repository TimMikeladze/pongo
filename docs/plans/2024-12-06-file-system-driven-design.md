# File-System Driven Architecture Design

## Overview

Transform Pongo from an in-memory CRUD app to a self-hosted, file-system driven uptime monitor where all configuration is defined in files. The UI becomes entirely read-only.

## Directory Structure

```
/data
  /monitors
    production-api.ts
    auth-service.ts
  /dashboards
    production-status.ts
  /announcements
    maintenance-dec-2024.md
  /incidents
    api-latency-2024-12-05.md
```

## Monitor Schema

```typescript
// data/monitors/production-api.ts
export default {
  name: "Production API",
  url: "https://api.example.com/health",
  method: "GET",                            // optional, defaults to GET
  headers: { Authorization: "Bearer ..." }, // optional
  body: "...",                              // optional, for POST/PUT
  interval: "30s",                          // human-readable duration
  timeout: "5s",                            // optional, defaults to 30s
  expectedStatus: 200,                      // optional, defaults to 200
  active: true,                             // optional, defaults to true
}
```

ID derived from filename.

## Dashboard Schema

```typescript
// data/dashboards/production-status.ts
export default {
  name: "Production Status",
  slug: "production",              // URL: /public/production
  public: true,                    // optional, defaults to false
  monitors: [
    "production-api",
    "auth-service",
  ],
  slaTarget: 99.9,                 // optional, percentage
}
```

ID derived from filename.

## Announcement Schema

```markdown
---
dashboard: production-status
title: Scheduled Maintenance
type: maintenance                  # info | warning | success | maintenance
expiresAt: 2024-12-15             # optional
---

Markdown body with rich formatting support.
```

ID derived from filename. `createdAt` from file metadata.

## Incident Schema

```markdown
---
dashboard: production-status
title: API Latency Issues
severity: major                    # critical | major | minor | maintenance
status: resolved                   # investigating | identified | monitoring | resolved
affectedMonitors:
  - production-api
  - auth-service
resolvedAt: 2024-12-05T14:30:00Z  # optional
---

## Investigating - Dec 5, 10:00 UTC
We're seeing elevated response times.

## Identified - Dec 5, 11:15 UTC
Root cause: database connection pool exhaustion.

## Resolved - Dec 5, 14:30 UTC
Fixed and monitoring.
```

ID derived from filename. Updates written as markdown sections in body.

## Loading Strategy

- Runtime file loading via `fs` module
- No file watching - restart server to pick up changes
- New `src/lib/loader.ts` module handles all file parsing

## UI Changes

Read-only UI. Remove:

- `/monitors/new` page
- `/dashboards/new` page
- `monitor-form.tsx`
- `dashboard-form.tsx`
- `announcement-form.tsx`
- `subscribe-form.tsx`
- All edit/delete buttons

## Check Results

Keep mock data generation for now. Charts remain functional until orchestration layer is added later.

## Dependencies

- `gray-matter` - Parse markdown frontmatter
- `marked` - Markdown to HTML
