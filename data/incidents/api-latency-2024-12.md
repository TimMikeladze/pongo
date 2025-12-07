---
dashboard: production-status
title: API Latency Issues
severity: minor
status: resolved
affectedMonitors:
  - production-api
resolvedAt: 2024-12-05T14:30:00Z
---

## Investigating - Dec 5, 10:00 UTC

We are investigating reports of increased API latency.

## Identified - Dec 5, 11:15 UTC

Root cause identified: database connection pool exhaustion.

## Resolved - Dec 5, 14:30 UTC

Issue resolved. Connection pool limits have been increased.
