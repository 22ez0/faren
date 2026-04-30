import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { profilePublicationsTable } from "./profile_publications";

export const publicationMediaTable = pgTable("publication_media", {
  id: serial("id").primaryKey(),
  publicationId: integer("publication_id").notNull().references(() => profilePublicationsTable.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("publication_media_publication_id_idx").on(t.publicationId),
]);

export type PublicationMedia = typeof publicationMediaTable.$inferSelect;
