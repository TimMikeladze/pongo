# Shared UI controls

Use the existing shadcn/ui components in `src/components/ui` throughout the redesigned application. Native monitor sorting and appearance selectors currently open operating-system menus; replace them with the shared Select so their menus follow the page theme, layering, focus and keyboard behavior.

Replace application-authored buttons, inputs, textareas, history sliders, toggle groups, tables and disclosures with Button, Input, Textarea, Slider, ToggleGroup, Table and Collapsible. Render action links through Button's `asChild`. Keep status colors through Badge. Preserve URL filters, sorting, preferences, chart state, history navigation, authentication and the existing page geometry. Markdown content and low-level native elements inside the shared primitives retain their HTML semantics.

Verify with typechecking, lint, unit tests and the existing browser suite. Add browser coverage for themed sort menus, keyboard selection, appearance persistence and the absence of application-authored native selectors. Check desktop and mobile rendering.

## Verification

`bunx tsc --noEmit`, `bun run lint`, all 103 unit tests, all 30 Playwright tests and the production build pass. Lint retains two existing CSS specificity warnings. The design detector reports eight advisory findings against existing type sizes and radii.

The browser checks cover every page at 390, 768 and 1440px, history views at 320px, themed monitor sorting with keyboard selection and focus restoration, appearance persistence, URL filters, chart expansion, short-screen sharing, and the mobile slider. Regression checks verify distinct status colors in both themes and wrapping for long mobile monitor names. Manual browser inspection confirmed the dark desktop and light mobile sort menus use the page palette and stay within the viewport.

Review found two CSS layer conflicts: the secondary Badge variant overrode status colors, and TableCell's white-space utility prevented long mobile names from wrapping. The status Badge variant leaves colors to the status tokens. Mobile name cells explicitly enable wrapping. Both regressions were reproduced with failing browser tests before the fixes. Independent review confirmed the fixes with no remaining material findings.
