import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organization } from "./auth-schema";

export * from "./auth-schema";

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  slug: text("slug").notNull().unique(),
  clicks: integer("clicks").notNull().default(0),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
