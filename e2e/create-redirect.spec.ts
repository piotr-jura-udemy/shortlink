import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./auth";

test("create a short link and redirect to the destination", async ({
  page,
}) => {
  const slug = `e2e-${Date.now().toString(36)}`;
  const destination = "https://example.com/";

  await signUp(page, {
    name: "Creator",
    email: uniqueEmail("creator"),
    password: "password123",
  });

  await page.getByRole("button", { name: "Create link", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Create a short link" }),
  ).toBeVisible();

  await dialog.locator("#create-url").fill(destination);
  await dialog.locator("#create-slug").fill(slug);
  await dialog.getByRole("button", { name: "Create link" }).click();

  await expect(
    dialog.getByRole("heading", { name: "Link created" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Create another" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Create a short link" }),
  ).toBeVisible();

  const secondSlug = `next-${Date.now().toString(36)}`;
  await dialog.locator("#create-url").fill("https://example.com/second");
  await dialog.locator("#create-slug").fill(secondSlug);
  await dialog.getByRole("button", { name: "Create link" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Link created" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();
  await expect(page.getByRole("link", { name: `/${secondSlug}` })).toBeVisible();

  const response = await page.goto(`/${slug}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.url()).toMatch(/^https:\/\/example\.com\/?/);

  await page.goto("/app");
  const row = page.getByRole("row").filter({ hasText: `/${slug}` });
  await expect(row).toContainText("1");
});
