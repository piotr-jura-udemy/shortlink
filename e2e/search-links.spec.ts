import { expect, test } from "@playwright/test";

test("search by slug filters the links table", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const matchSlug = `find-me-${suffix}`;
  const otherSlug = `other-${suffix}`;

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "shortlink" })).toBeVisible();

  for (const [slug, path] of [
    [matchSlug, "/match"],
    [otherSlug, "/other"],
  ] as const) {
    await page.getByRole("button", { name: "Create link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Create a short link" }),
    ).toBeVisible();
    await dialog.locator("#create-url").fill(`https://example.com${path}`);
    await dialog.locator("#create-slug").fill(slug);
    await dialog.getByRole("button", { name: "Create link" }).click();
    await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();
    await expect(dialog).toBeHidden();
  }

  const search = page.getByRole("searchbox", { name: "Search links" });
  await search.fill(matchSlug);

  await expect(page.getByRole("link", { name: `/${matchSlug}` })).toBeVisible();
  await expect(page.getByRole("link", { name: `/${otherSlug}` })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`[?&]q=${matchSlug}`));
});
