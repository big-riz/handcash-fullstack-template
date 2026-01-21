import { pgTable, text, timestamp, decimal, boolean, jsonb, serial, integer } from "drizzle-orm/pg-core"

/**
 * Core Tables (replacing existing file-based storage)
 */

export const payments = pgTable("payments", {
    id: text("id").primaryKey(),
    paymentRequestId: text("payment_request_id").notNull(),
    transactionId: text("transaction_id").notNull().unique(),
    amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    paidBy: text("paid_by"),
    paidAt: timestamp("paid_at").notNull().defaultNow(),
    status: text("status").notNull(), // 'completed' | 'failed' | 'cancelled'
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
})

export const collections = pgTable("collections", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
})

export const itemTemplates = pgTable("item_templates", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    multimediaUrl: text("multimedia_url"),
    collectionId: text("collection_id").references(() => collections.id, { onDelete: "cascade" }),
    attributes: jsonb("attributes"),
    rarity: text("rarity"),
    color: text("color"),
    pool: text("pool").default("default"),
    spawnWeight: integer("spawn_weight").default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
})

export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    eventType: text("event_type").notNull(),
    userId: text("user_id"),
    sessionId: text("session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    resource: text("resource"),
    action: text("action"),
    details: jsonb("details"),
    success: boolean("success").default(true),
})

/**
 * Extensibility Tables (new functionality)
 */

export const users = pgTable("users", {
    id: text("id").primaryKey(), // HandCash user ID
    handle: text("handle").notNull().unique(), // @handle
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    email: text("email"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastActiveAt: timestamp("last_active_at").defaultNow(),
    preferences: jsonb("preferences").default({}),
    metadata: jsonb("metadata").default({}),
})

export const mintedItems = pgTable("minted_items", {
    id: text("id").primaryKey(),
    origin: text("origin").notNull().unique(), // HandCash item origin
    collectionId: text("collection_id").references(() => collections.id),
    templateId: text("template_id").references(() => itemTemplates.id),
    mintedToUserId: text("minted_to_user_id"),
    mintedToHandle: text("minted_to_handle"),
    itemName: text("item_name").notNull(),
    rarity: text("rarity"),
    imageUrl: text("image_url"),
    multimediaUrl: text("multimedia_url"),
    paymentId: text("payment_id").references(() => payments.id),
    mintedAt: timestamp("minted_at").defaultNow(),
    metadata: jsonb("metadata"),
})

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(), // Session ID
    userId: text("user_id").references(() => users.id),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
    lastActivityAt: timestamp("last_activity_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    isActive: boolean("is_active").default(true),
})

export const rateLimits = pgTable("rate_limits", {
    key: text("key").primaryKey(), // IP:endpoint or user:endpoint
    count: integer("count").default(1),
    windowStart: timestamp("window_start").defaultNow(),
    windowMs: integer("window_ms").notNull(),
})

// Type exports for TypeScript
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert

export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert

export type ItemTemplate = typeof itemTemplates.$inferSelect
export type NewItemTemplate = typeof itemTemplates.$inferInsert

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type MintedItem = typeof mintedItems.$inferSelect
export type NewMintedItem = typeof mintedItems.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type RateLimit = typeof rateLimits.$inferSelect
export type NewRateLimit = typeof rateLimits.$inferInsert
