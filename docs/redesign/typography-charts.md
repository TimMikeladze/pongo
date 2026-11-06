# Geist and service history

Use Geist for interface text and chart labels, with Geist Mono for code. Keep measurements aligned with tabular numerals. Load both variable fonts through `next/font` with swap rendering and shared CSS variables.

Service rows put the name and current status first. A separate line labels availability and average response, with a compact History/Trend control. Controls center their icons and expose their selected state. Both views reserve the same chart height; trend values use a fixed 0–100% scale and preserve gaps in missing data. Date labels use the interface font. Existing keyboard history navigation and mobile inspection stay available.

Verify the public page at 320, 390, 768 and 1440px in both themes, switch views, inspect history with arrow keys, and check no-data charts. Run type checking, the unit suite, and browser regression checks.

Verification: 96 unit tests, 21 Playwright tests, TypeScript, scoped Biome checks and a production Next.js build passed. The initial browser test launch found an existing development server using the test output directory; the suite reused that server on port 4319. The design detector reported existing type/radius advisories; the new control uses palette tokens and the existing rounded scale.
