import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const usernameRedirectsTable = pgTable(
  "username_redirects",
  {
    id: serial("id").primaryKey(),
    oldUsername: text("old_username").notNull().unique(),
    targetUserId: integer("target_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    targetUserIdx: index("username_redirects_target_user_idx").on(table.targetUserId),
  }),
);

export type UsernameRedirect = typeof usernameRedirectsTable.$inferSelect;
