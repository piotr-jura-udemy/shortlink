import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Regression: upgrading a pre-auth sqlite.db (0000 only + existing links rows)
 * must apply 0001/0002 — including rateLimit — instead of failing on
 * ALTER TABLE links ADD organization_id NOT NULL.
 */
describe("drizzle upgrade from pre-auth DB", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-migrate-upgrade-"));
  const dbPath = path.join(tmpDir, "upgrade.sqlite.db");

  beforeAll(async () => {
    const client = createClient({ url: `file:${dbPath}` });
    // Apply only migration 0000 + journal row (hash/when from drizzle/meta/_journal.json).
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      );
      INSERT INTO __drizzle_migrations (hash, created_at) VALUES (
        '904a255b3cd1ff6b94ca55854cea2f978b7e2e3578d1aaa371443efe56160859',
        1791989472755
      );
      CREATE TABLE \`links\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`url\` text NOT NULL,
        \`slug\` text NOT NULL,
        \`clicks\` integer DEFAULT 0 NOT NULL,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL
      );
      CREATE UNIQUE INDEX \`links_slug_unique\` ON \`links\` (\`slug\`);
      INSERT INTO links (id, url, slug, clicks, created_at, updated_at)
      VALUES ('legacy-1', 'https://example.com', 'legacy', 0, 1, 1);
    `);
    client.close();

    execSync("npx drizzle-kit migrate", {
      stdio: "pipe",
      env: { ...process.env, SQLITE_PATH: dbPath },
      cwd: process.cwd(),
    });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates rateLimit and organization_id even when links already had rows", async () => {
    const client = createClient({ url: `file:${dbPath}` });
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.rows.map((r) => String(r.name));
    expect(names).toContain("rateLimit");
    expect(names).toContain("user");
    expect(names).toContain("organization");
    expect(names).toContain("sign_in_attempt");

    const cols = await client.execute("PRAGMA table_info(links)");
    const colNames = cols.rows.map((r) => String(r.name));
    expect(colNames).toContain("organization_id");

    const links = await client.execute("SELECT COUNT(*) AS c FROM links");
    expect(Number(links.rows[0]?.c)).toBe(0);

    const migrations = await client.execute(
      "SELECT COUNT(*) AS c FROM __drizzle_migrations",
    );
    expect(Number(migrations.rows[0]?.c)).toBe(3);
    client.close();
  });
});
