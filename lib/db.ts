import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import * as schema from "./schema";

function resolveDbPath(): string {
  if (process.env.SQLITE_PATH) {
    return path.isAbsolute(process.env.SQLITE_PATH)
      ? process.env.SQLITE_PATH
      : path.join(/*turbopackIgnore: true*/ process.cwd(), process.env.SQLITE_PATH);
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "sqlite.db");
}

const dbPath = resolveDbPath();

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
