import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
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
  musicTitle: text("music_title"),
  musicIconUrl: text("music_icon_url"),
  musicPrivate: boolean("music_private").default(false),
  badges: text("badges").array().default([]),
  discordUserId: text("discord_user_id"),
  discordUsername: text("discord_username"),
  discordAvatarUrl: text("discord_avatar_url"),
  discordStatus: text("discord_status"),
  discordActivity: text("discord_activity"),
  discordStatusEmoji: text("discord_status_emoji"),
  discordNitro: boolean("discord_nitro").default(false),
  discordBoost: boolean("discord_boost").default(false),
  showDiscordAvatar: boolean("show_discord_avatar").default(true),
  showDiscordPresence: boolean("show_discord_presence").default(true),
  musicConnected: text("music_connected").default("false"),
  musicService: text("music_service"),
  musicToken: text("music_token"),
  musicUsername: text("music_username"),
  particleEffect: text("particle_effect").default("none"),
  clickEffect: text("click_effect").default("none"),
  fontFamily: text("font_family").default("default"),
  layoutStyle: text("layout_style").default("centered"),
  typewriterTexts: text("typewriter_texts").array().default([]),
  profileTitle: text("profile_title"),
  showViews: boolean("show_views").default(true),
  backgroundBlur: real("background_blur").default(0),
  backgroundType: text("background_type").default("image"),
  dashboardBgColor: text("dashboard_bg_color").default("#000000"),
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
