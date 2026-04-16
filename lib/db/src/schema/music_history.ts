import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const musicHistoryTable = pgTable("music_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  albumArt: text("album_art"),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMusicHistorySchema = createInsertSchema(musicHistoryTable).omit({ id: true });
export type InsertMusicHistory = z.infer<typeof insertMusicHistorySchema>;
export type MusicHistory = typeof musicHistoryTable.$inferSelect;
