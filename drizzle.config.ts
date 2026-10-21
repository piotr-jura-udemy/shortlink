import { defineConfig } from "drizzle-kit";
import path from "node:path";

const sqlitePath = process.env.SQLITE_PATH
  ? path.isAbsolute(process.env.SQLITE_PATH)
    ? process.env.SQLITE_PATH
    : path.join(process.cwd(), process.env.SQLITE_PATH)
  : path.join(process.cwd(), "sqlite.db");

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath,
  },
});
