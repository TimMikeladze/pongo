---
name: Pongo
description: Dense service status and monitor triage for the Pongo web application.
colors:
  dark-background: "#000000"
  dark-foreground: "#ededed"
  dark-card: "#0a0a0a"
  dark-muted: "#111111"
  dark-muted-foreground: "#a1a1a1"
  dark-accent: "#1a1a1a"
  dark-border: "#262626"
  dark-primary: "#ededed"
  dark-primary-foreground: "#0a0a0a"
  dark-status-up: "#69c8a3"
  dark-status-up-bg: "#0f2a20"
  dark-status-down: "#f29696"
  dark-status-down-bg: "#3a1a1c"
  dark-status-degraded: "#edc078"
  dark-status-degraded-bg: "#33270f"
  dark-status-pending: "#a1a1a1"
  dark-status-pending-bg: "#1a1a1a"
  dark-status-scheduled: "#a9baf3"
  dark-status-scheduled-bg: "#1c2440"
  dark-bar: "#419d7b"
  light-background: "#ffffff"
  light-foreground: "#0a0a0a"
  light-card: "#ffffff"
  light-muted: "#fafafa"
  light-muted-foreground: "#666666"
  light-accent: "#f2f2f2"
  light-border: "#e5e5e5"
  light-primary: "#171717"
  light-primary-foreground: "#ffffff"
  light-status-up: "#237251"
  light-status-up-bg: "#e5f3eb"
  light-status-down: "#a8333b"
  light-status-down-bg: "#fdecef"
  light-status-degraded: "#865b17"
  light-status-degraded-bg: "#fff2d9"
  light-status-pending: "#666666"
  light-status-pending-bg: "#f2f2f2"
  light-status-scheduled: "#45619c"
  light-status-scheduled-bg: "#ebeffb"
  light-bar: "#3e9976"
typography:
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "22px"
    fontWeight: 620
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  description:
    fontFamily: "Geist, sans-serif"
    fontSize: "13px"
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "12px"
  measurement:
    fontFamily: "Geist Mono, monospace"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  table-number:
    fontFamily: "Geist Mono, monospace"
    fontSize: "12px"
rounded:
  pill: "5px"
  navigation: "6px"
  control: "7px"
  base: "8px"
  panel: "10px"
  history: "2px"
spacing:
  compact: "6px"
  control-gap: "8px"
  row-gap: "10px"
  panel-inset: "12px"
  mobile-section: "14px"
  section: "16px"
  main-bottom: "24px"
components:
  button-primary:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "6px 12px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "6px 12px"
    height: "32px"
  button-ghost:
    textColor: "{colors.dark-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "6px 12px"
    height: "32px"
  shell-control:
    textColor: "{colors.dark-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
    height: "28px"
  monitor-search:
    backgroundColor: "{colors.dark-card}"
    textColor: "{colors.dark-foreground}"
    typography: "{typography.description}"
    rounded: "{rounded.control}"
    padding: "6px 10px 6px 34px"
    height: "32px"
  navigation-link:
    textColor: "{colors.dark-muted-foreground}"
    typography: "{typography.description}"
    rounded: "{rounded.navigation}"
    padding: "4px 8px"
    height: "28px"
  status-pill:
    backgroundColor: "{colors.dark-status-up-bg}"
    textColor: "{colors.dark-status-up}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 7px"
  panel:
    backgroundColor: "{colors.dark-card}"
    textColor: "{colors.dark-foreground}"
    rounded: "{rounded.panel}"
  metric-strip:
    textColor: "{colors.dark-foreground}"
    padding: "10px 14px"
  performance-disclosure:
    textColor: "{colors.dark-foreground}"
    typography: "{typography.title}"
    padding: "10px 0"
---

# Design System: Pongo

## Overview

**Creative North Star: "Service status and monitor triage"**

Pongo uses compact neutral surfaces, system sans text and explicit service states. The same shell aligns operator pages, public status pages and authentication screens. Color identifies status or interaction; spacing and borders establish hierarchy.

The implemented direction comes from the user-approved mockups and the denser full-site brief. Configuration, live measurements and existing actions remain the content of the interface.

**Key Characteristics:**

- One content width across header, main and footer.
- Compact rows with readable supporting labels.
- Green, amber, red and neutral service states with text labels.
- Dark and light themes share the same structure.

## Colors

The dark theme sits on pure black (#000000) and the light theme on pure white (#ffffff), with untinted neutral grays for surfaces and borders and restrained semantic colors. The frontmatter records the current dark and light values; `src/app/globals.css` implements them through the same semantic CSS properties.

### Primary

The primary action surface is near-white in dark mode and near-black in light mode. Primary text inverts against that surface. The focus ring and text caret use the operational green.

### Secondary

Green means operational, amber degraded, red outage, neutral pending and blue scheduled. Tinted surfaces support matching labels. Availability bars use the dedicated bar token for successful checks. These are state roles, not interchangeable decorative accents.

### Neutral

Background is the page canvas; card is a raised tonal surface; muted is the subtle table/header surface. Foreground, muted foreground and border carry text hierarchy and structural separation. Accent is the hover or selected surface.

| CSS role | Dark frontmatter key | Light frontmatter key |
| --- | --- | --- |
| Page canvas | `dark-background` | `light-background` |
| Main text | `dark-foreground` | `light-foreground` |
| Panel surface | `dark-card` | `light-card` |
| Subtle surface | `dark-muted` | `light-muted` |
| Supporting text | `dark-muted-foreground` | `light-muted-foreground` |
| Selected surface | `dark-accent` | `light-accent` |
| Structural border | `dark-border` | `light-border` |

**The Status Meaning Rule.** A state color accompanies a state label. Unknown or paused service data retains its stated meaning rather than implying success or failure.

## Typography

System sans is used for headings, controls and prose. System monospace is reserved for code, file names and numeric measurements. Font stacks and measured role values are in the frontmatter; no downloaded font is required.

The root remains (16px), so the standard extra-small utility resolves to a readable label (12px). Body text is (14px). Page descriptions and table text are (13px); section titles are (15px). Page headings use the headline role, with a mobile size of (20px). Metric values use tabular numerals. Descriptions wrap at a maximum of (70ch), with empty-state copy limited to (60ch).

## Layout

Header, main, public tabs and footer use one centered container: `min(calc(100% - 2 * gutter), content-width)`. The normal maximum is (1120px), with gutters of (20px) and mobile gutters of (16px). Full width changes the shared maximum to (100%) while preserving those gutters. The shell fills at least the dynamic viewport height and reserves scrollbar space.

The header has a minimum height of (48px). Its identity block pairs a (24px) logo with a (14px) wordmark and an (11px) context label below it. The secondary line defaults to `Demo deployment` and can be set with `NEXT_PUBLIC_HEADER_CAPTION`. It uses typography rather than a vertical divider; long names truncate within the same bounded block. Header controls are (32px), increasing to (44px) on mobile. Main content has top padding of (16px) and bottom padding of (24px). The normal section gap is (16px); mobile uses (14px) and dense mode (12px). Footer content has a minimum height of (40px) with a (16px) logo. Numeric strips distribute metrics into columns with a minimum of (140px), becoming two columns on mobile.

At widths up to (900px), brand and controls remain on the first row and operator navigation wraps below with horizontal overflow. At widths up to (640px), navigation icons disappear, nav labels use (12px) with inline padding of (8px), headings wrap, monitor search fills its row, and monitor table rows become compact groups with visible numeric labels. Alert rows also reflow into labeled groups with visible state, time, duration and rule actions. Other wide tables scroll within their container.

Zen mode hides the header, footer and public tabs, preserves the content width, and exposes fixed recovery controls at the bottom right. Escape restores the shell unless an open dialog is handling it. Theme, density and width preferences restore after hydration so controls agree with the server render.

**The Shared Width Rule.** Header, main, public tabs and footer retain the same left edge and width on every route; page primitives do not add narrower containers.

## Elevation & Depth

The page uses tonal layering and uniform borders. Panels and charts have no added decorative shadow. Existing library popovers, dialogs and controls may retain their component shadow or focus ring; those remain interaction affordances rather than a new surface hierarchy. Status indicators have no glow. Reduced-motion preferences shorten animations and transitions and disable smooth scrolling.

## Shapes

Panels, chart surfaces, notices and empty states share rounded corners and a uniform border (1px). Panel positioning remains relative so nested scroll surfaces clip within the card. Controls have compact rounded corners, pills are slightly tighter, and history bars use small rounded ends. Frontmatter radius roles record the values. Structural dividers and accessible focus outlines remain visible.

## Components

### Buttons and fields

Primary, outline and ghost buttons preserve their existing component variants. Standard library buttons, inputs and selects are (32px) tall; small and shell controls have a minimum height of (28px). Shell controls use an outlined neutral surface, selected/hover fill, and compact text. Search fields use the shared shadcn InputGroup, a leading icon and reserved space for a clear action. They are (32px) tall on desktop and at least (44px) on touch devices. Filters use a bordered group and a filled selected state; mobile groups can wrap. On coarse pointers, actions, selectors and menu items have (44px) targets. Calendar dates and history bars retain compact grid cells.

The global focus treatment is a ring-colored outline (2px) offset by (3px). Library fields and buttons retain their own focus border/ring states and invalid/disabled styling. Every icon-only action needs an accessible name. The skip link becomes visible on keyboard focus and targets the main region.

### Navigation

Operator links use muted labels and a filled surface for the current route. Public Status, Incidents, Maintenance and Updates tabs use a structural bottom divider, a minimum tab height of (36px), and an active underline. The shell supplies brand, theme and feed actions.

### Status and availability

Status pills combine a short label, tinted background and optional small dot (6px). History buttons are compact (24px) bars with accessible date, status and measurement text. A history group has one tab stop and supports arrow keys, Home and End; pointer and keyboard inspection expose the same details. Mobile adds a bounded inspector with 44px period controls and a slider. Missing measurements render an em dash or an awaiting-check label.

### Panels, metrics and tables

Panels hold existing content without changing its width. Dedicated empty pages use centered copy; embedded empty states omit nested frames or use a compact structural divider. Metric strips use border separators, subdued labels and larger monospace values. Desktop tables align numeric values right, with a subtle header surface and row dividers. Monitor rows support search, status filters and sorting; attention rows use a subtle warning surface.

### Disclosures and charts

Public status pages lead with service state and inspectable history. Performance charts remain behind a disclosure with a rotating chevron. Footer Page options gathers labeled view, documentation, support and authentication controls. A direct GitHub link appears beside the footer controls when `NEXT_PUBLIC_GITHUB_URL` is configured. Operator overview and monitor pages lead with health, alerts and the monitor list before detailed charts. Incident summaries expose date, state, impact and duration before expansion. Charts retain their existing range and expansion controls; dialogs return focus when closed.

## Do's and Don'ts

### Do:

- Do align every route to the shared shell, including public and authentication pages.
- Do keep code and measurements in monospace and prose in system sans.
- Do pair status colors with state text and preserve unknown measurements.
- Do retain keyboard inspection, focus visibility and recovery controls in zen mode.

### Don't:

- Don't add decorative rails, dotted backgrounds, status glows or halo effects.
- Don't turn missing results into healthy uptime or zero latency.
- Don't add nested width containers that narrow individual pages.
- Don't reduce all text globally when density changes.

Application controls use the shadcn/ui primitives in `src/components/ui`. Select renders monitor sorting and appearance menus in the active theme. ToggleGroup represents single-choice filters and chart views, with radio roles and arrow-key navigation. Table retains the existing responsive row layouts. Disclosure composes Collapsible and Button for performance and About sections; incident updates use the same primitives. Mobile history uses Slider with a named thumb and period value text. Badge's status variant preserves the status color tokens. Native HTML within the shared primitives and rendered Markdown remains unchanged.

Search clearing preserves the current filter and returns keyboard focus to the field. Escape clears a nonempty search before the shell handles Escape. Monitor sort, search and filter selections are URL-backed; invalid sort/filter values use the default selection.
