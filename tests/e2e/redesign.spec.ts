import { expect, type Page, test } from "@playwright/test";

// Each test represents a separate visitor, including independent login limits.
test.beforeEach(async ({ context }, testInfo) => {
  await context.setExtraHTTPHeaders({
    "x-forwarded-for": `e2e-${testInfo.testId}`,
  });
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("Access code", { exact: true })
    .fill("test-access-code");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

const operatorRoutes = [
  "/",
  "/monitors",
  "/monitors/vercel",
  "/dashboards",
  "/dashboards/status",
  "/dashboards/status/incidents",
  "/dashboards/status/announcements",
  "/alerts",
  "/settings",
  "/settings/notifications",
];
const publicRoutes = [
  "/shared/status",
  "/shared/status/incidents",
  "/shared/status/maintenance",
  "/shared/status/announcements",
];

for (const width of [390, 768, 1440]) {
  test(`every page uses the shared shell without overflow at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await signIn(page);
    for (const route of [...operatorRoutes, ...publicRoutes, "/login"]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const bounds = await Promise.all(
        ["shell-header", "shell-main", "shell-footer"].map((id) =>
          page.getByTestId(id).boundingBox(),
        ),
      );
      expect(bounds.every(Boolean), route).toBe(true);
      for (const item of bounds.slice(1)) {
        expect(item?.x, `${route} left edge`).toBe(bounds[0]?.x);
        expect(item?.width, `${route} width`).toBe(bounds[0]?.width);
      }
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        width: document.documentElement.clientWidth,
        gutter: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--page-gutter",
          ),
        ),
      }));
      expect(geometry.overflow, `${route} has page overflow`).toBe(false);
      expect(bounds[0]?.width, route).toBe(
        Math.min(1120, geometry.width - geometry.gutter * 2),
      );
      if (route.startsWith("/shared/")) {
        await expect(
          page.getByRole("navigation", { name: "Status page navigation" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Maintenance", exact: true }),
        ).toBeVisible();
      }
    }
  });
}

test("public history and feeds stay accessible without a session", async ({
  page,
  request,
}) => {
  for (const route of publicRoutes) {
    expect((await page.goto(route))?.status()).toBe(200);
    await expect(
      page.getByRole("navigation", { name: "Status page navigation" }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Get status updates" }).click();
  await expect(
    page.getByRole("link", { name: "Atom feed", exact: true }),
  ).toHaveAttribute("href", "/shared/status/feed.atom");
  for (const route of [
    "/shared/status/feed.xml",
    "/shared/status/feed.atom",
    "/shared/status/status.json",
  ])
    expect((await request.get(route)).ok()).toBe(true);
  await page.goto("/shared/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Page not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('meta[name="robots"][content="noindex"]').first(),
  ).toHaveAttribute("content", "noindex");
});

test("unknown measurements and monitor search do not imply healthy checks", async ({
  page,
}) => {
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "Waiting for the first check results" }),
  ).toBeVisible();
  await expect(page.getByText("No check data", { exact: true })).toBeVisible();
  await page.goto("/monitors?q=vercel");
  const table = page.getByRole("table");
  await expect(
    table.getByRole("link", { name: "Vercel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Showing 1 of 3 monitors", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search monitors").fill("not-a-monitor");
  await expect(page.getByText("No monitors match your filters")).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByText("Showing 3 of 3 monitors", { exact: true }),
  ).toBeVisible();
  await expect(
    table.getByText("Awaiting first check", { exact: true }),
  ).toHaveCount(3);
  await page.goto("/shared/status");
  await expect(
    page.getByRole("heading", { name: "Awaiting service checks", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("100.00%", { exact: true })).toHaveCount(0);
});

test("theme, full width, zen and chart expansion preserve recovery controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.goto("/settings");
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("light");
  await page.getByLabel("Content width", { exact: true }).selectOption("full");
  const fullWidth =
    (await page.getByTestId("shell-main").boundingBox())?.width ?? 0;
  expect(fullWidth).toBeGreaterThan(1120);
  await page.getByRole("button", { name: "Page options", exact: true }).click();
  await page
    .getByRole("button", { name: "Constrain width", exact: true })
    .click();
  expect((await page.getByTestId("shell-main").boundingBox())?.width).toBe(
    1120,
  );
  await page.getByRole("button", { name: "Page options", exact: true }).click();
  await page
    .getByRole("button", { name: "Enter zen mode", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Exit zen mode", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("shell-header")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("shell-header")).toBeVisible();
  await page.goto("/");
  await page
    .locator("details.performance-disclosure")
    .first()
    .locator("summary")
    .click();
  await page
    .getByRole("button", { name: "Expand Response time chart", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Response time", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Expand Response time chart",
      exact: true,
    }),
  ).toBeFocused();
});

test("service history has one tab stop and supports range changes and arrow keys", async ({
  page,
}) => {
  await page.goto("/shared/status");
  const history = page.getByRole("group", {
    name: "Availability history for Vercel",
    exact: true,
  });
  await expect(history.locator('button[tabindex="0"]')).toHaveCount(1);
  const active = history.locator('button[tabindex="0"]');
  await active.focus();
  const previous = await active.getAttribute("aria-label");
  await page.keyboard.press("ArrowLeft");
  await expect(history.locator('button[tabindex="0"]')).toBeFocused();
  expect(
    await history.locator('button[tabindex="0"]').getAttribute("aria-label"),
  ).not.toBe(previous);
  await page
    .getByRole("button", { name: "Reporting period", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Reporting range", exact: true })
    .getByRole("button", { name: "7d", exact: true })
    .click();
  await expect(page).toHaveURL(/preset=7d/);
  await expect(history.locator('button[tabindex="0"]')).toHaveCount(1);
});

test("monitor filters remain shareable after a reload", async ({ page }) => {
  await signIn(page);
  await page.goto("/monitors");
  await page.getByLabel("Search monitors").fill("vercel");
  await expect(page).toHaveURL(/q=vercel/);
  await page.reload();
  await expect(page.getByLabel("Search monitors")).toHaveValue("vercel");
  await expect(
    page.getByText("Showing 1 of 3 monitors", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Needs attention/ }).click();
  await expect(page).toHaveURL(/filter=attention/);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page).not.toHaveURL(/[?&](q|filter)=/);
  await page.reload();
  await expect(page.getByLabel("Search monitors")).toHaveValue("");
  await expect(
    page.getByText("Showing 3 of 3 monitors", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Search monitors")).toHaveValue("vercel");
  await expect(
    page.getByRole("button", { name: /Needs attention/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("long public dashboard names fit the mobile header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shared/status");
  await page
    .getByTestId("shell-header")
    .locator(".brand-context")
    .evaluate((element) => {
      element.textContent = "West Coast Production Services and Integrations";
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await expect(
    page.getByRole("button", { name: "Get status updates" }),
  ).toBeInViewport();
});

test("long history ranges retain visible mobile bars", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shared/status?preset=7d&interval=30m");
  const history = page.getByRole("group", {
    name: "Availability history for Vercel",
    exact: true,
  });
  await expect(history.locator("button").first()).toBeVisible();
  const widths = await history
    .locator("button")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width),
    );
  expect(widths.length).toBeGreaterThan(0);
  expect(Math.min(...widths)).toBeGreaterThan(0);
});

test("dashboard filters restore after reload and browser navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto("/dashboards");
  const search = page.getByRole("searchbox", {
    name: "Search dashboards",
    exact: true,
  });
  const searchBounds = await search.boundingBox();
  const filterBounds = await page
    .getByRole("group", { name: "Filter dashboards", exact: true })
    .boundingBox();
  expect(
    (searchBounds?.y ?? 0) + (searchBounds?.height ?? 0),
  ).toBeLessThanOrEqual(filterBounds?.y ?? 0);
  await search.fill("status");
  await expect(page).toHaveURL(/q=status/);
  await page.reload();
  await expect(search).toHaveValue("status");
  await page.getByRole("button", { name: /^Public/ }).click();
  await expect(page).toHaveURL(/filter=public/);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page).not.toHaveURL(/[?&]q=/);
  await page.goBack();
  await expect(search).toHaveValue("status");
  await expect(page.getByRole("button", { name: /^Public/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("support sharing stays within a short viewport and excludes collapsed fields", async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto("/shared/status");
  await expect(
    page.getByRole("heading", { name: "Awaiting service checks", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Page options", exact: true }).click();
  await page
    .getByRole("button", { name: "Support Pongo", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Support Pongo",
    exact: true,
  });
  const share = dialog.getByRole("button", { name: /^Share Pongo/ });
  await expect(share).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await share.click();
  await expect(share).toHaveAttribute("aria-expanded", "true");
  const geometry = await dialog.boundingBox();
  expect(geometry?.y).toBeGreaterThanOrEqual(0);
  expect((geometry?.y ?? 0) + (geometry?.height ?? 0)).toBeLessThanOrEqual(500);
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeInViewport();
  await share.click();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(
    page.getByRole("button", { name: "Page options", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("mobile history can be inspected with large period controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shared/status?preset=7d&interval=30m");
  const trigger = page.getByRole("button", {
    name: "Inspect history for Vercel",
    exact: true,
  });
  await trigger.click();
  const inspector = page.getByRole("dialog", {
    name: "Vercel history inspection",
    exact: true,
  });
  const slider = inspector.getByRole("slider", {
    name: "Vercel history period",
    exact: true,
  });
  const initialPeriod = await slider.inputValue();
  await inspector
    .getByRole("button", { name: "Previous period for Vercel", exact: true })
    .click();
  await expect(slider).toHaveValue(String(Number(initialPeriod) - 1));
  await inspector
    .getByRole("button", { name: "Next period for Vercel", exact: true })
    .click();
  await expect(slider).toHaveValue(initialPeriod);
  await expect(
    inspector.getByText("First interval", { exact: true }),
  ).toBeVisible();
  const bounds = await inspector.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
