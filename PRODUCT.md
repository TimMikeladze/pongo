# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Operators inspect monitor health, investigate failures and response times, run checks, and manage alert state. Visitors read public status pages, incidents, maintenance and updates without a session.

## Product Purpose

Pongo is a self-hosted uptime monitoring application with public status pages. It shows current service health and historical measurements while retaining the actions needed to investigate and respond to failures.

## Positioning

Monitors, dashboards, alert conditions and notification channels are TypeScript configuration. Incidents and announcements are Markdown. Configuration lives alongside application code rather than in UI creation forms.

## Operating Context

A Next.js and React web app reads configuration and monitoring data. A standalone Bun scheduler runs configured checks, evaluates alert conditions and dispatches webhooks. Drizzle supports SQLite and PostgreSQL; the database driver follows the configured connection string. An archiver can move historical data to S3-compatible storage as Parquet.

## Capabilities and Constraints

- Monitors support intervals or cron schedules, manual runs, time ranges, region views, response-time statistics and uptime history.
- Dashboards expose service status, incidents, maintenance announcements, updates, RSS and Atom feeds, and a public status JSON endpoint.
- Alerts use configured conditions and webhook channels, including resolution and acknowledgement state. Notification configuration remains in code; the interface documents it.
- `ACCESS_CODE` optionally protects operator routes with encrypted cookie sessions. The root overview, shared pages, login and API paths remain public according to the route proxy; individual API handlers retain their own access checks.
- An unmeasured service remains pending. Paused monitors and missing results must retain their meaning, and production screens read configured monitors and stored measurements.

## Brand Commitments

Keep the Pongo name, existing logo and supported site/header/footer branding overrides. Interface copy describes the available action or measurement directly. The approved redesign changes presentation while preserving monitoring, configuration, authentication and data contracts.

## Evidence on Hand

The repository contains actual monitor and dashboard configuration under `pongo/`, incident and announcement Markdown, application routes and tests. The approved visual references are the HTML mockups under `public/ui-mockups/`; the implementation record is in `docs/superpowers/specs/2026-11-02-pongo-redesign.md` and `docs/redesign/README.md`. Review screenshots use an isolated synthetic fixture and do not represent production telemetry.

## Product Principles

- Keep configuration version-controlled in TypeScript and Markdown.
- Show current health independently of historical aggregation.
- Distinguish missing measurements from measured uptime and latency.
- Preserve public access to status information and feed subscriptions.
