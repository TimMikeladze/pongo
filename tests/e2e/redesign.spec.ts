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
  ...(process.env.SHOW_HOW_IT_WORKS === "false"
    ? []
    : ["/shared/status/how-it-works"]),
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
        width: document.body.getBoundingClientRect().width,
        gutter: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--page-gutter",
          ),
        ),
      }));
      expect(geometry.overflow, `${route} has page overflow`).toBe(false);
      const header = page.getByTestId("shell-header").locator("..");
      await expect(header.locator("+ div.shell-container")).toHaveCount(0);
      if (route === "/" || route === "/monitors") {
        const toolbar = await page
          .locator(".monitor-toolbar:visible")
          .boundingBox();
        const table = await page.locator(".table-scroll:visible").boundingBox();
        expect(
          (table?.y ?? 0) - ((toolbar?.y ?? 0) + (toolbar?.height ?? 0)),
          `${route} filter spacing`,
        ).toBeGreaterThanOrEqual(16);
      }
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

test("agent setup instructions stay public and discoverable", async ({
  page,
  request,
}) => {
  const instructions = await request.get("/llms.txt");
  expect(instructions.status()).toBe(200);
  expect(await instructions.text()).toContain(
    "https://pongo.sh/skills/create-pongo/SKILL.md",
  );
  const skill = await request.get("/skills/create-pongo/SKILL.md");
  expect(skill.status()).toBe(200);
  expect(await skill.text()).toContain("name: create-pongo");
  const admin = await request.get("/settings", { maxRedirects: 0 });
  expect(admin.status()).toBe(307);
  expect(admin.headers().location).toContain("/login");

  await page.goto("/shared/status");
  await expect(page.locator('head link[href="/llms.txt"]')).toHaveAttribute(
    "type",
    "text/plain",
  );
  if (process.env.SHOW_HOW_IT_WORKS !== "false") {
    await page.goto("/shared/status/how-it-works");
    await expect(
      page.getByRole("heading", {
        name: "Create a status page with an agent",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "create-pongo skill", exact: true }),
    ).toHaveAttribute("href", "/skills/create-pongo/SKILL.md");
    await page
      .getByRole("link", { name: "create-pongo skill", exact: true })
      .click();
    await expect(page).toHaveURL(/\/skills\/create-pongo\/SKILL\.md$/);
    await expect(page.locator("body")).toContainText("name: create-pongo");
  }
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
  await expect(page.getByLabel("Theme", { exact: true })).toContainText(
    "Light",
  );
  await page.getByLabel("Content width", { exact: true }).click();
  await page.getByRole("option", { name: "Full width", exact: true }).click();
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
    .locator(".performance-disclosure")
    .first()
    .locator('[data-slot="collapsible-trigger"]')
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
  await page.getByRole("radio", { name: /Needs attention/ }).click();
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
    page.getByRole("radio", { name: /Needs attention/ }),
  ).toHaveAttribute("aria-checked", "true");
});

test("long header captions fit the mobile header", async ({ page }) => {
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
    .getByRole("radiogroup", { name: "Filter dashboards", exact: true })
    .boundingBox();
  expect(
    (searchBounds?.y ?? 0) + (searchBounds?.height ?? 0),
  ).toBeLessThanOrEqual(filterBounds?.y ?? 0);
  await search.fill("status");
  await expect(page).toHaveURL(/q=status/);
  await page.reload();
  await expect(search).toHaveValue("status");
  await page.getByRole("radio", { name: /^Public/ }).click();
  await expect(page).toHaveURL(/filter=public/);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page).not.toHaveURL(/[?&]q=/);
  await page.goBack();
  await expect(search).toHaveValue("status");
  await expect(page.getByRole("radio", { name: /^Public/ })).toHaveAttribute(
    "aria-checked",
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
  await expect(
    page.getByRole("button", { name: "Support Pongo", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByTestId("shell-main").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(
    page.getByRole("button", { name: "Page options", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
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
  const initialPeriod = await slider.getAttribute("aria-valuenow");
  await inspector
    .getByRole("button", { name: "Previous period for Vercel", exact: true })
    .click();
  await expect(slider).toHaveAttribute(
    "aria-valuenow",
    String(Number(initialPeriod) - 1),
  );
  await inspector
    .getByRole("button", { name: "Next period for Vercel", exact: true })
    .click();
  await expect(slider).toHaveAttribute("aria-valuenow", initialPeriod ?? "");
  await expect(
    inspector.getByText("First interval", { exact: true }),
  ).toBeVisible();
  const bounds = await inspector.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("header copy and footer repository link follow public configuration", async ({
  page,
}) => {
  await page.goto("/shared/status");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const header = page.getByTestId("shell-header");
  await expect(header.locator(".brand-name")).toHaveText(
    process.env.NEXT_PUBLIC_SITE_NAME ?? "pongo.sh",
  );
  await expect(header.locator(".brand-context")).toHaveText(
    process.env.NEXT_PUBLIC_HEADER_CAPTION ?? "Demo deployment",
  );
  const github = page
    .getByTestId("shell-footer")
    .getByRole("link", { name: "GitHub", exact: true });
  const repository = process.env.NEXT_PUBLIC_GITHUB_URL?.trim();
  const caption = page.getByTestId("shell-footer").getByRole("link", {
    name:
      process.env.NEXT_PUBLIC_FOOTER_CAPTION ?? "Open-source uptime monitoring",
    exact: true,
  });
  await expect(caption).toHaveAttribute(
    "href",
    repository || "https://github.com/TimMikeladze/pongo",
  );
  await expect(caption).toHaveAttribute("rel", "noopener noreferrer");
  if (repository && process.env.NEXT_PUBLIC_HIDE_GITHUB !== "true") {
    await expect(github).toHaveAttribute("href", repository);
    await expect(github).toHaveAttribute("rel", "noopener noreferrer");
  } else {
    await expect(github).toHaveCount(0);
  }
});

for (const width of [320, 390, 768, 1440]) {
  test(`service charts keep labeled metrics and stable views at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/shared/status");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("Geist");
    const bars = page.getByRole("group", {
      name: "Availability history for Vercel",
      exact: true,
    });
    const historyHeight = (await bars.boundingBox())?.height;
    const row = bars.locator("..");
    await expect(row.getByText("Availability", { exact: true })).toBeVisible();
    await expect(row.getByText("Avg. response", { exact: true })).toBeVisible();
    const toggle = page.getByRole("radiogroup", {
      name: "History view for Vercel",
      exact: true,
    });
    const trendButton = toggle.getByRole("radio", {
      name: "Availability sparkline for Vercel",
      exact: true,
    });
    await trendButton.click();
    await expect(trendButton).toHaveAttribute("aria-checked", "true");
    const trend = page.getByRole("img", { name: /Vercel availability trend/ });
    await expect(trend).toBeVisible();
    expect((await trend.boundingBox())?.height).toBe(historyHeight);
    await toggle
      .getByRole("radio", {
        name: "Availability bars for Vercel",
        exact: true,
      })
      .click();
    await expect(bars).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}

for (const width of [390, 768, 1440]) {
  test(`header and footer remain visible while content scrolls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await signIn(page);
    for (const route of ["/monitors/vercel", "/shared/status"]) {
      await page.goto(route);
      const header = page.getByTestId("shell-header");
      const footer = page.getByTestId("shell-footer");
      const main = page.getByTestId("shell-main");
      await expect(header).toBeInViewport();
      await expect(footer).toBeInViewport();
      const start = {
        header: await header.boundingBox(),
        footer: await footer.boundingBox(),
      };
      await main.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(header).toBeInViewport();
      await expect(footer).toBeInViewport();
      expect(await header.boundingBox()).toEqual(start.header);
      expect(await footer.boundingBox()).toEqual(start.footer);
      const scroll = await main.evaluate((element) => ({
        top: element.scrollTop,
        max: element.scrollHeight - element.clientHeight,
      }));
      expect(scroll.max).toBeGreaterThan(0);
      expect(scroll.top).toBeGreaterThanOrEqual(scroll.max - 1);
      if (route.startsWith("/shared/")) {
        await expect(
          page.getByRole("navigation", { name: "Status page navigation" }),
        ).toBeInViewport();
        await page
          .getByRole("link", { name: "Maintenance", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "Maintenance", exact: true }),
        ).toBeInViewport();
      }
    }
  });
}

test("How it works renders the README with working anchors and public screenshots", async ({
  page,
  request,
}) => {
  await page.goto("/shared/status");
  const tab = page.getByRole("link", { name: "How it works", exact: true });
  if (process.env.SHOW_HOW_IT_WORKS === "false") {
    await expect(tab).toHaveCount(0);
    expect((await request.get("/shared/status/how-it-works")).status()).toBe(
      404,
    );
    return;
  }
  await tab.click();
  await expect(tab).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "How it works", exact: true }),
  ).toBeVisible();
  const article = page.locator(".readme-content");
  await expect(
    article.getByRole("heading", { name: "Quick Start", exact: true }),
  ).toBeVisible();
  await article.getByRole("link", { name: "Quick Start", exact: true }).click();
  await expect(
    article.getByRole("heading", { name: "Quick Start", exact: true }),
  ).toBeInViewport();
  await expect(page.getByTestId("shell-header")).toBeInViewport();
  await expect(page.getByTestId("shell-footer")).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  const code = article.locator('pre[data-language="bash"]').first();
  await expect(
    code.locator('span[style*="--shiki-light"]').first(),
  ).toBeVisible();
  expect(
    await code.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(false);
  await expect(
    page.getByRole("navigation", { name: "Status page navigation" }),
  ).toHaveCSS("overflow-y", "hidden");
  await expect(page.getByTestId("shell-main")).toHaveCSS(
    "scrollbar-width",
    "none",
  );
  expect((await request.get("/readme/overview-dark.png")).status()).toBe(200);
  await page.goto("/shared/does-not-exist/how-it-works");
  await expect(
    page.getByRole("heading", { name: "Page not found", exact: true }),
  ).toBeVisible();
});

test("monitor sort uses a themed menu with keyboard selection", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/monitors");
  const sort = page.getByRole("combobox", { name: "Sort monitors" });
  await expect(sort).toHaveAttribute("data-slot", "select-trigger");
  await sort.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Status first" }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: "Slowest first" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sort).toContainText("Slowest first");
  await expect(sort).toBeFocused();
  await sort.click();
  await page.getByRole("option", { name: "Name A–Z" }).click();
  const names = await page
    .getByRole("table")
    .locator("tbody tr td:first-child > a")
    .allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  await sort.click();
  await page.keyboard.press("Escape");
  await expect(sort).toBeFocused();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await sort.click();
  await expect(page.locator('[data-slot="select-content"]')).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("appearance selectors persist choices and retain zen recovery", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/settings");
  const theme = page.getByRole("combobox", { name: "Theme", exact: true });
  await theme.click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.reload();
  await expect(theme).toContainText("Light");
  await expect(page.locator("html")).toHaveClass(/light/);
  const width = page.getByRole("combobox", {
    name: "Content width",
    exact: true,
  });
  await width.click();
  await page.getByRole("option", { name: "Full width", exact: true }).click();
  await page.reload();
  await expect(width).toContainText("Full width");
  await page.getByRole("combobox", { name: "View mode", exact: true }).click();
  await page.getByRole("option", { name: "Zen mode", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Exit zen mode", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("shell-header")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "View mode", exact: true }),
  ).toContainText("Standard");
  await expect(page.locator("select:visible")).toHaveCount(0);
});

test("status badges distinguish healthy, degraded and down states in both themes", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/monitors");
  const pill = page.locator('.monitor-table [data-slot="badge"]').first();
  for (const theme of ["dark", "light"]) {
    const colors = [];
    for (const status of ["up", "degraded", "down"]) {
      colors.push(
        await pill.evaluate((element, value) => {
          element.setAttribute("data-status", value);
          const style = getComputedStyle(element);
          return `${style.color}/${style.backgroundColor}`;
        }, status),
      );
    }
    expect(new Set(colors).size, `${theme} status colors`).toBe(3);
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to light theme" }).click();
  }
});

test("long monitor names wrap inside mobile table cells", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto("/monitors");
  const cell = page.locator(".monitor-table tbody tr td:first-child").first();
  await cell.locator("a").evaluate((element) => {
    element.textContent =
      "Production monitoring gateway with a long regional service name";
  });
  await cell.locator(".monitor-subtitle").evaluate((element) => {
    element.textContent =
      "production-monitoring-gateway-west-coast-primary-region.ts";
  });
  expect(
    await cell.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
});

test("monitor sorting survives reload and browser navigation", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/monitors?q=vercel&preset=7d");
  const sort = page.getByRole("combobox", { name: "Sort monitors" });
  await sort.click();
  await page.getByRole("option", { name: "Name A–Z", exact: true }).click();
  await expect(page).toHaveURL(/sort=name/);
  await page.reload();
  await expect(sort).toContainText("Name A–Z");
  await expect(
    page.getByRole("searchbox", { name: "Search monitors" }),
  ).toHaveValue("vercel");
  await sort.click();
  await page
    .getByRole("option", { name: "Slowest first", exact: true })
    .click();
  await expect(page).toHaveURL(/sort=latency/);
  await page.goBack();
  await expect(sort).toContainText("Name A–Z");
  await expect(page).toHaveURL(/preset=7d/);
  await page.goto("/monitors?sort=invalid&filter=invalid");
  await expect(sort).toContainText("Status first");
  await expect(page.getByRole("radio", { name: /^All/ })).toBeChecked();
});

test("shared search clears without losing filters or moving controls", async ({
  page,
}) => {
  await signIn(page);
  for (const config of [
    {
      route: "/monitors?filter=attention&sort=name",
      name: "Search monitors",
      filter: "attention",
    },
    {
      route: "/dashboards?filter=public",
      name: "Search dashboards",
      filter: "public",
    },
  ]) {
    await page.goto(config.route);
    const search = page.getByRole("searchbox", {
      name: config.name,
      exact: true,
    });
    const before = await search.boundingBox();
    await search.fill("nothing-matches");
    await expect(page).toHaveURL(/q=nothing-matches/);
    await expect(
      page.getByRole("button", { name: "Clear search", exact: true }),
    ).toBeVisible();
    expect((await search.boundingBox())?.width).toBe(before?.width);
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`filter=${config.filter}`));
    await search.fill("another-search");
    await search.press("Escape");
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    await expect(page).not.toHaveURL(/[?&]q=/);
  }
});

test.describe("touch controls", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("pages and the date picker fit a narrow touch screen", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 844 });
    await signIn(page);
    for (const route of [...operatorRoutes, ...publicRoutes]) {
      expect((await page.goto(route))?.status(), route).toBe(200);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        route,
      ).toBe(false);
    }
    await page.goto("/shared/status");
    expect(
      (await page.locator("[data-history-bar]").first().boundingBox())?.width,
    ).toBeLessThan(44);
    await page
      .getByRole("button", { name: "Reporting period", exact: true })
      .tap();
    const picker = page.getByRole("dialog");
    await expect(picker).toBeVisible();
    expect(
      await picker.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await expect(page.locator('[data-slot="calendar"]')).toBeVisible();
  });
  for (const width of [320, 390]) {
    test(`search, filters and menu items have touch targets at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await signIn(page);
      await page.goto("/monitors");
      const controls = [
        page.getByRole("searchbox", { name: "Search monitors" }),
        page.getByRole("radio", { name: /^All/ }),
        page.getByRole("radio", { name: /Needs attention/ }),
        page.getByRole("combobox", { name: "Sort monitors" }),
      ];
      for (const control of controls)
        expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(
          44,
        );
      await page.getByRole("combobox", { name: "Sort monitors" }).tap();
      await expect
        .poll(
          async () =>
            (await page.getByRole("option", { name: "Name A–Z" }).boundingBox())
              ?.height ?? 0,
        )
        .toBeGreaterThanOrEqual(44);
      await page.getByRole("option", { name: "Name A–Z" }).tap();
      await page
        .getByRole("searchbox", { name: "Search monitors" })
        .fill("vercel");
      const clear = page.getByRole("button", {
        name: "Clear search",
        exact: true,
      });
      const bounds = await clear.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
    });
  }
});
