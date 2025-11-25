import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Google Fit OAuth tokens
export const googleFitTokens = pgTable("google_fit_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleFitTokenSchema = createInsertSchema(googleFitTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGoogleFitToken = z.infer<typeof insertGoogleFitTokenSchema>;
export type GoogleFitToken = typeof googleFitTokens.$inferSelect;

// Daily fitness metrics from Google Fit
export const fitnessMetrics = pgTable("fitness_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  rhr: integer("rhr"), // Resting heart rate
  hrv: integer("hrv"), // Heart rate variability
  sleepScore: integer("sleep_score"),
  sleepConsistency: integer("sleep_consistency"),
  workoutIntensity: integer("workout_intensity"),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fats: integer("fats"),
  steps: integer("steps"),
  deepSleepMinutes: integer("deep_sleep_minutes"),
  spo2: decimal("spo2", { precision: 4, scale: 1 }),
  recoveryScore: integer("recovery_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFitnessMetricSchema = createInsertSchema(fitnessMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFitnessMetric = z.infer<typeof insertFitnessMetricSchema>;
export type FitnessMetric = typeof fitnessMetrics.$inferSelect;

// AI-generated insights
export const insights = pgTable("insights", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("daily"), // daily, weekly, monthly
  generatedAt: timestamp("generated_at").defaultNow(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  generatedAt: true,
});
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;
