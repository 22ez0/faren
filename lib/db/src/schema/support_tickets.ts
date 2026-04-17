import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  username: text("username"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  socialNetwork: text("social_network"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SupportTicket = typeof supportTicketsTable.$inferSelect;
