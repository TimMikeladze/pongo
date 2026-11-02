# Pongo redesign progress

Scope: all 14 existing page routes plus public maintenance, the denser approved mockups, consistent widths, and a reviewed PR with passing CI.

## Completed

- Created an isolated checkout on `codex/pongo-ui-redesign` from `1ecd8af`. The original checkout’s unrelated dependency edits are excluded.
- Recreated public/dashboard and operator pages, shared shell, navigation, page primitives, tables, controls and missing/error/loading states. Runtime data and existing operations are preserved.
- Fixed independent review findings: long header labels, zero-width long-history bars, URL filter persistence, mobile alert actions, disclosure cues, metric hierarchy, noisy empty states, touch history inspection and Support dialog sizing/keyboard behavior.
- Added route/layout and interaction regressions. The final design review inspected all 15 desktop/mobile route pairs and approved the implementation. The mobile dashboard search/filter collision found during that review is fixed and covered.

## Decisions

The user’s approved mockups and full redesign request authorize execution. Independent page domains and review passes were delegated under the applicable parallel-work/review skills; the root owns integration.

Header, main and footer use one 1120px maximum. Full width changes all three together. Histories group long ranges into at most 90 contiguous periods, retain measured checks and worst recorded state, and expose grouping/missing intervals in tooltips and the mobile inspector. Sparklines retain every aggregation interval.

Monitor filters use shallow URL state; dashboard filters use URL state with server filtering. Browser reload and back/forward restore both. Maintenance still uses the existing empty provider; no scheduling backend was added.

Support regression tests wait for the streamed page heading before interacting with its footer. Footer Page options also closes if its anchor leaves the viewport, preventing a detached popup during scrolling or route scroll restoration. Zen mode unmounts the popup so Escape reaches its recovery control.

## Delivery

Implementation and final local checks are complete: 96 unit tests, 16 browser tests, lint, typecheck and production Next build. Both final independent reviews found no material remaining issues.

[PR #27](https://github.com/TimMikeladze/pongo/pull/27) is open from `codex/pongo-ui-redesign` to main. CI exposed a cross-platform width-test assumption: Linux reserves a 6px scrollbar gutter while macOS overlays it. The expected width now uses the body’s available inline width; exact shell alignment and no-overflow assertions remain. CI results are tracked on the PR.
