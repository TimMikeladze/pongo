# README screenshots and shared spacing

Link the footer caption to the configured GitHub repository, falling back to Pongo's repository. Keep the separate GitHub button's existing visibility setting. Remove the empty shell divider below the already bordered header, which duplicates the line across operator routes. Add 16px between monitor filters and the table on overview and monitor pages.

Capture the running application after those changes: a dark operator overview and a light public status page at 1440px. Save the images under `public/readme/`, reference them from the root README, and label the local review data as illustrative. Check both images, local Markdown targets, footer URLs, and desktop/mobile geometry. Extend the existing browser checks for the footer and shared shell.

Verification: both captures loaded Geist, had no horizontal overflow, and used the updated footer and spacing. Browser checks passed all 21 tests, including the shared header and monitor-table spacing at 390, 768 and 1440px. TypeScript and scoped Biome checks passed.
