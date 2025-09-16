import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  grantedScopes: jsonb("granted_scopes").$type<string[]>().default([]),
  appInventory: jsonb("app_inventory").$type<string[]>().default([]),
  executedTasks: jsonb("executed_tasks").$type<any[]>().default([]),
  sessionRevenue: text("session_revenue").default("0"),
  startTime: timestamp("start_time").defaultNow(),
  lastActionTime: timestamp("last_action_time").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const consentRequests = pgTable("consent_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  scope: text("scope").notNull(),
  status: text("status").$type<'pending' | 'granted' | 'denied'>().default('pending'),
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<'safe' | 'balanced' | 'aggressive'>().notNull(),
  roiRange: text("roi_range").notNull(),
  timeEstimate: text("time_estimate").notNull(),
  riskLevel: text("risk_level").notNull(),
  requiredScopes: jsonb("required_scopes").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
});

export const actions = pgTable("actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  tool: text("tool").notNull(),
  args: jsonb("args").$type<Record<string, any>>().notNull(),
  status: text("status").$type<'pending' | 'success' | 'failed'>().default('pending'),
  result: jsonb("result").$type<any>(),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  startTime: true,
  lastActionTime: true,
});

export const insertConsentRequestSchema = createInsertSchema(consentRequests).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  executedAt: true,
});

export const agentRequestSchema = z.object({
  message: z.string(),
  audioData: z.string().optional(),
});

export const consentResponseSchema = z.object({
  requestId: z.string(),
  approved: z.boolean(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertConsentRequest = z.infer<typeof insertConsentRequestSchema>;
export type ConsentRequest = typeof consentRequests.$inferSelect;

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;

export type InsertAction = z.infer<typeof insertActionSchema>;
export type Action = typeof actions.$inferSelect;

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type ConsentResponse = z.infer<typeof consentResponseSchema>;
