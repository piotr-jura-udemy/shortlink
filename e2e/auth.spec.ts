import { expect, test } from "@playwright/test";
import { signIn, signUp, uniqueEmail } from "./auth";

test("unauthenticated /app redirects to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("signup creates a private workspace; other users cannot see links", async ({
  page,
  browser,
}) => {
  const password = "password123";
  const aliceEmail = uniqueEmail("alice");
  const bobEmail = uniqueEmail("bob");
  const slug = `iso-${Date.now().toString(36)}`;

  await signUp(page, {
    name: "Alice",
    email: aliceEmail,
    password,
  });

  await page.getByRole("button", { name: "Create link", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("#create-url").fill("https://example.com/private");
  await dialog.locator("#create-slug").fill(slug);
  await dialog.getByRole("button", { name: "Create link" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Link created" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await signUp(bobPage, {
    name: "Bob",
    email: bobEmail,
    password,
  });
  await expect(bobPage.getByRole("link", { name: `/${slug}` })).toHaveCount(0);

  const response = await bobPage.goto(`/${slug}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.url()).toMatch(/^https:\/\/example\.com\/private\/?/);

  await bobContext.close();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await signIn(page, { email: aliceEmail, password });
  await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();
});
