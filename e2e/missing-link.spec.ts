import { expect, test } from "@playwright/test";

test("unknown short link shows the missing path page", async ({ page }) => {
  const slug = `missing-${Date.now().toString(36)}`;

  await page.goto(`/${slug}`);

  await expect(
    page.getByRole("heading", { name: "Path not found" }),
  ).toBeVisible();
  await expect(page.getByText(`/${slug}`)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to shortlink" }),
  ).toBeVisible();
});
