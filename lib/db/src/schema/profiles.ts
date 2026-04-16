import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bio: text("bio"),
  bannerUrl: text("banner_url"),
  backgroundUrl: text("background_url"),
  accentColor: text("accent_color").default("#8b5cf6"),
  backgroundOpacity: real("background_opacity").default(0.8),
  glowColor: text("glow_color").default("#8b5cf6"),
  cursorStyle: text("cursor_style").default("default"),
  musicUrl: text("music_url"),
  badges: text("badges").array().default([]),
  discordUserId: text("discord_user_id"),
  discordUsername: text("discord_username"),
  discordAvatarUrl: text("discord_avatar_url"),
  discordStatus: text("discord_status"),
  discordActivity: text("discord_activity"),
  discordStatusEmoji: text("discord_status_emoji"),
  musicConnected: text("music_connected").default("false"),
  musicService: text("music_service"),
  musicToken: text("music_token"),
  musicUsername: text("music_username"),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
