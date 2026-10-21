import { expect, test } from "@playwright/test";

test("create a short link and redirect to the destination", async ({
  page,
}) => {
  const slug = `e2e-${Date.now().toString(36)}`;
  const destination = "https://example.com/";

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "shortlink" })).toBeVisible();

  await page.getByRole("button", { name: "Create link", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Create a short link" }),
  ).toBeVisible();

  await dialog.locator("#create-url").fill(destination);
  await dialog.locator("#create-slug").fill(slug);
  await dialog.getByRole("button", { name: "Create link" }).click();

  await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();

  const response = await page.goto(`/${slug}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.url()).toMatch(/^https:\/\/example\.com\/?/);

  await page.goto("/app");
  const row = page.getByRole("row").filter({ hasText: `/${slug}` });
  await expect(row).toContainText("1");
});
