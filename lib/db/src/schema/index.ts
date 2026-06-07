import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  balance: real("balance").notNull().default(0),
  safeBalance: real("safe_balance").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  choice: text("choice").notNull(),
  amount: real("amount").notNull(),
  dice1: integer("dice1"),
  dice2: integer("dice2"),
  dice3: integer("dice3"),
  won: boolean("won").notNull().default(false),
  payout: real("payout").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertBetSchema = createInsertSchema(betsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Bet = typeof betsTable.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
