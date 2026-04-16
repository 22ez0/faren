import { pgTable, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const followersTable = pgTable("followers", {
  followerId: integer("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]);

export type Follower = typeof followersTable.$inferSelect;
