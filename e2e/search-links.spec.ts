import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./auth";

test("search by slug filters the links table", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const matchSlug = `find-me-${suffix}`;
  const otherSlug = `other-${suffix}`;

  await signUp(page, {
    name: "Searcher",
    email: uniqueEmail("search"),
    password: "password123",
  });

  for (const [slug, path] of [
    [matchSlug, "/match"],
    [otherSlug, "/other"],
  ] as const) {
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Create link", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Create a short link" }),
    ).toBeVisible();
    await dialog.locator("#create-url").fill(`https://example.com${path}`);
    await dialog.locator("#create-slug").fill(slug);
    await dialog.getByRole("button", { name: "Create link" }).click();
    await expect(
      dialog.getByRole("heading", { name: "Link created" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: `/${slug}` })).toBeVisible();
  }

  const search = page.getByRole("searchbox", { name: "Search links" });
  await search.fill(matchSlug);

  await expect(page.getByRole("link", { name: `/${matchSlug}` })).toBeVisible();
  await expect(page.getByRole("link", { name: `/${otherSlug}` })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`[?&]q=${matchSlug}`));
});
