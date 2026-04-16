import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const profileViewsTable = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  profileUserId: integer("profile_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  country: text("country"),
  device: text("device"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileView = typeof profileViewsTable.$inferSelect;
