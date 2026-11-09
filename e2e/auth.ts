import { expect, type BrowserContext, type Page } from "@playwright/test";

const clientIps = new WeakMap<BrowserContext, string>();
let nextClientIp = 1;

/**
 * Give each browser context its own client IP (via the trusted header set in
 * playwright.config.ts) so the suite is not one client sharing the per-IP
 * auth rate limits — retries would otherwise exhaust them.
 */
async function assignClientIp(page: Page) {
  const context = page.context();
  if (clientIps.has(context)) return;
  const n = nextClientIp++;
  const ip = `198.18.${Math.floor(n / 250)}.${(n % 250) + 1}`;
  clientIps.set(context, ip);
  await context.setExtraHTTPHeaders({ "x-e2e-client-ip": ip });
}

export async function signUp(
  page: Page,
  {
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  },
) {
  await assignClientIp(page);
  await page.goto("/signup");
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole("heading", { name: "shortlink" })).toBeVisible();
}

export async function signIn(
  page: Page,
  {
    email,
    password,
  }: {
    email: string;
    password: string;
  },
) {
  await assignClientIp(page);
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole("heading", { name: "shortlink" })).toBeVisible();
}

export function uniqueEmail(prefix = "user") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}
