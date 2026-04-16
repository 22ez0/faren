import { pgTable, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const profileLikesTable = pgTable("profile_likes", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  profileUserId: integer("profile_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.profileUserId] })]);

export type ProfileLike = typeof profileLikesTable.$inferSelect;
