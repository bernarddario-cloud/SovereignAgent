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
  action: text("action").notNull(),
  scope: text("scope").notNull(),
  parameters: jsonb("parameters").$type<Record<string, any>>().notNull(),
  dryRun: boolean("dry_run").default(true),
  dryRunResult: jsonb("dry_run_result").$type<any>(),
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
  dryRun: boolean("dry_run").default(false),
  requiresConsent: boolean("requires_consent").default(true),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  action: text("action").notNull(),
  channel: text("channel").$type<'api' | 'shortcut' | 'manual'>().notNull(),
  status: text("status").$type<'sent' | 'confirmed' | 'failed'>().notNull(),
  payload: jsonb("payload").$type<Record<string, any>>().notNull(),
  result: jsonb("result").$type<any>(),
  hash: text("hash").notNull(),
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

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  timestamp: true,
});

export const agentRequestSchema = z.object({
  message: z.string(),
  audioData: z.string().optional(),
});

export const consentResponseSchema = z.object({
  requestId: z.string(),
  approved: z.boolean(),
});

export const consentPreviewSchema = z.object({
  action: z.string(),
  scope: z.string(),
  parameters: z.record(z.any()),
  dryRun: z.boolean().default(true),
});

export const executeActionSchema = z.object({
  consentRequestId: z.string(),
  confirm: z.boolean(),
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

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type ConsentResponse = z.infer<typeof consentResponseSchema>;
export type ConsentPreview = z.infer<typeof consentPreviewSchema>;
export type ExecuteAction = z.infer<typeof executeActionSchema>;
