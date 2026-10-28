import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

test("QR code encodes the short URL and downloads a PNG", async ({
  page,
}) => {
  const slug = `qr-${Date.now().toString(36)}`;

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "shortlink" })).toBeVisible();

  await page.getByRole("button", { name: "Create link", exact: true }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.locator("#create-url").fill("https://example.com/qr");
  await createDialog.locator("#create-slug").fill(slug);
  await createDialog.getByRole("button", { name: "Create link" }).click();

  await expect(
    createDialog.getByRole("heading", { name: "Link created" }),
  ).toBeVisible();
  await expect(createDialog.getByRole("button", { name: "Show QR code" })).toBeVisible();
  await expect(createDialog.getByRole("button", { name: "Copy short link" })).toBeVisible();

  await createDialog.getByRole("button", { name: "Show QR code" }).click();

  const qrDialog = page.getByRole("dialog").filter({ hasText: "QR code" });
  await expect(qrDialog.getByRole("heading", { name: "QR code" })).toBeVisible();

  const expectedUrl = `http://127.0.0.1:3100/${slug}`;
  await expect(qrDialog.getByText(expectedUrl)).toBeVisible();

  const canvas = qrDialog.locator("canvas");
  await expect(canvas).toBeVisible();

  const encoded = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).getAttribute("title"),
  );
  expect(encoded).toBe(`QR code for ${expectedUrl}`);

  const downloadPromise = page.waitForEvent("download");
  await qrDialog.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(`${slug}-qr.png`);

  const tempPath = path.join(os.tmpdir(), download.suggestedFilename());
  await download.saveAs(tempPath);
  const stat = fs.statSync(tempPath);
  expect(stat.size).toBeGreaterThan(100);
  fs.unlinkSync(tempPath);

  await page.keyboard.press("Escape");
  await createDialog.getByRole("button", { name: "Done" }).click();

  const row = page.getByRole("row").filter({ hasText: `/${slug}` });
  await row.getByRole("button", { name: "Show QR code" }).click();
  const tableQr = page.getByRole("dialog").filter({ hasText: "QR code" });
  await expect(tableQr.getByRole("heading", { name: "QR code" })).toBeVisible();
  await expect(tableQr.getByText(expectedUrl)).toBeVisible();
});
