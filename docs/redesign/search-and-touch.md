# Search, sorting and touch controls

Continue the shadcn migration with one shared search field for monitors and dashboards. Compose the existing InputGroup, InputGroupInput, InputGroupAddon and Button primitives. Reserve space for the clear action so typing does not change toolbar width. Clearing by button or Escape preserves the status/visibility filter and returns focus to the field.

Store monitor sorting in the URL alongside the search and status filter. Use literal parsers for supported sorts and filters, fall back to defaults for invalid values, and preserve reporting-range parameters. Reload and browser navigation must restore the selected sort.

On touch devices, give application actions, selectors, filters and search controls a 44px target. Keep availability bars compact because they already have the separate touch history inspector. Preserve desktop density, status colors and existing page layout. Keep mobile name wrapping through the table breakpoint.

Verify with browser regressions for sort reload/back behavior, clear/search focus and filter preservation, and real touch emulation at 320px and 390px. Run existing browser, unit, type, lint and build checks after the change. Keep production configuration and telemetry unchanged.

## Verification

The full 35-test browser suite passed with the CI single-worker setting, including the narrow touch route sweep. All 103 unit tests, typechecking, lint and the production build pass. Lint keeps two pre-existing CSS specificity warnings; the design detector reports eight existing advisory findings. Independent review found no material issues.

Touch checks use `hasTouch` and `isMobile` at 320px and 390px, measure the clear button, filters, selectors and menu items, and inspect every route at 320px. The date picker stays within its popover; history bars and calendar dates retain their compact grids. Manual browser inspection confirms shared search, distinct clear actions, preserved sort selection and no page overflow.
