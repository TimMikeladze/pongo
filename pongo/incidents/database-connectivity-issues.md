---
dashboard: demo
title: Database Connectivity Issues
severity: major
status: resolved
affectedMonitors:
  - database
  - api-health
resolvedAt: "2025-12-05T14:30:00Z"
---

## Investigating - Dec 5, 10:15 UTC

We are investigating reports of increased database connection errors. Some API requests may be failing or experiencing high latency.

## Identified - Dec 5, 11:00 UTC

Root cause identified: a connection pool exhaustion issue caused by a recent deployment. Rolling back the change now.

## Monitoring - Dec 5, 12:30 UTC

Rollback complete. Database connections are recovering. We are monitoring the situation closely.

## Resolved - Dec 5, 14:30 UTC

All systems are operating normally. The connection pool configuration has been fixed and will be re-deployed with proper testing.
