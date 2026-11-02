# Pongo Interface Redesign Implementation Plan

> **For agentic workers:** Use the written ownership boundaries. Parallel workers handle disjoint public/dashboard and operator routes; the root implements shared foundations and integration. Do not spawn nested workers.

**Goal:** Port the approved mockups into a denser redesign of every Pongo page, verify the whole application, and open a passing PR.

**Architecture:** Keep Next server data loading and existing action contracts. A shared shell and layout primitives establish one width, typography and density; public pages and operator pages render task-specific views. Existing chart implementations remain available behind disclosures.

**Tech Stack:** Next.js App Router, React, Tailwind, Radix, Bun, SQLite/PostgreSQL and existing Recharts.

**Spec:** `docs/superpowers/specs/2026-11-02-pongo-redesign.md`

## Global Constraints

- One 1120px maximum content width; 24px desktop / 16px mobile gutters; all header/main/footer edges align.
- Dense default: 64px header, 24px section separation, 12–16px rows, 20–24px uptime bars, 14px body text and normally 12px minimum labels.
- Preserve actual product data, configuration, authentication, feeds, actions and charts. No synthetic production data or unrelated dependency edits.
- All 14 existing page routes plus public maintenance get the redesign; unknown measurements stay unknown.
- Work only in the isolated redesign branch, review and verify, then open a PR against main.

## Review Focus

- Empty databases and paused monitors must not falsely report healthy or 100% availability.
- Deep public incident/update routes must retain public brand/navigation and enforce public-dashboard visibility.
- Long monitor names, query strings and many navigation items must remain usable at 390px.
- Full-width/zen/theme preferences must affect the entire shell consistently without obscuring recovery controls.
- Login, trigger actions and alert silencing must keep their original authorization and refresh behavior.

### Task 1: Foundations and dense mockup reference

**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/app-shell.tsx`, `src/components/page-layout.tsx`, `src/lib/health.ts`, `src/lib/health.test.ts`, shared controls.

- [x] Tighten the original mockup reference while retaining its shared width.
- [x] Add health tests for no results, mixed states and down/degraded/pending precedence; run and observe failure.
- [x] Implement the pure health summary and common layout interfaces from the spec.
- [x] Replace the shell and theme tokens with the approved dense system; preserve branding overrides, auth, fullscreen, density and full-width recovery.
- [x] Run focused unit checks and browser shell checks.

### Task 2: Public and dashboard surfaces

**Files:** dashboard/shared pages and public/dashboard display components listed in the spec ownership section.

- [x] Recreate status-first public pages and compact dashboard views using actual data.
- [x] Redesign public index, dashboards index/detail, both incident/announcement route families and the public maintenance page.
- [x] Make status history keyboard inspectable and preserve performance views, SLA and feeds.
- [x] Check missing/empty data, unresolved incidents, zero maintenance and route visibility.

### Task 3: Operator routes and overview

**Files:** root overview/monitor table (root), monitor/alert/settings/login routes (operator worker), their owned components.

- [x] Implement monitor-table data/view modules and the task-first overview; retain all six charts within a performance section.
- [x] Recreate monitor list/detail, alert table/timeline/actions, settings, notification settings and login in the shared dense design.
- [x] Preserve regional details, query filters, manual triggers, login errors and alert controls.
- [x] Update docs for changed navigation and unknown-data behavior.

### Task 4: Full-site verification and review

**Files:** `tests/e2e`, fixtures as needed, redesign documentation and screenshot evidence.

- [x] Add meaningful route/layout/accessibility checks; verify the failure against the original design before relying on them.
- [x] Run lint, typecheck, unit tests, e2e and build, fixing failures within scope.
- [x] Render every route at desktop/mobile and inspect tablet, light/dark, unknown/degraded and expanded states. Verify exact shell bounds across routes.
- [x] Request independent diff and visual review, address material findings, and record route evidence.

### Task 5: PR and CI

- [x] Review/stage only redesign files; commit on the feature branch.
- [x] Push and open a PR to main describing behavior and validation.
- [ ] Watch the PR checks, fix any CI failures, and report the PR URL after checks pass.
