import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const profileLinksTable = pgTable("profile_links", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProfileLinkSchema = createInsertSchema(profileLinksTable).omit({ id: true, createdAt: true });
export type InsertProfileLink = z.infer<typeof insertProfileLinkSchema>;
export type ProfileLink = typeof profileLinksTable.$inferSelect;
