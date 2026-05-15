import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders without auth", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/pongo/i);
  });

  test("protected route redirects to /login when no session", async ({
    page,
  }) => {
    await page.goto("/monitors");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder("access code")).toBeVisible();
  });

  test("login with invalid code shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("access code").fill("wrong-code");
    await page.getByRole("button", { name: /enter/i }).click();
    await expect(page.getByText(/invalid access code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
