import { pgTable, text, timestamp, decimal, boolean, jsonb, serial, integer, index } from "drizzle-orm/pg-core"

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
    supplyLimit: integer("supply_limit").default(0),
    isArchived: boolean("is_archived").default(false),
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
    isArchived: boolean("is_archived").default(false),
    metadata: jsonb("metadata"),
}, (table) => [
    index("minted_items_user_idx").on(table.mintedToUserId),
    index("minted_items_collection_idx").on(table.collectionId),
    index("minted_items_template_idx").on(table.templateId),
])

export const mintIntents = pgTable("mint_intents", {
    id: text("id").primaryKey(),
    paymentRequestId: text("payment_request_id").notNull().unique(),
    paymentRequestUrl: text("payment_request_url").notNull(),
    userId: text("user_id").notNull(),
    handle: text("handle").notNull(), // User handle for reference
    collectionId: text("collection_id"),
    templateId: text("template_id"),
    quantity: integer("quantity").default(1),
    supplyCount: integer("supply_count"),
    activationTime: timestamp("activation_time"),
    amountBsv: decimal("amount_bsv", { precision: 18, scale: 8 }),
    status: text("status").notNull().default("pending_payment"), // pending_payment | paid | activated | expired | cancelled
    transactionId: text("transaction_id"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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

// Drizzle Relations for easier querying
import { relations } from "drizzle-orm"

export const collectionsRelations = relations(collections, ({ many }) => ({
    itemTemplates: many(itemTemplates),
    mintedItems: many(mintedItems),
}))

export const itemTemplatesRelations = relations(itemTemplates, ({ one, many }) => ({
    collection: one(collections, {
        fields: [itemTemplates.collectionId],
        references: [collections.id],
    }),
    mintedItems: many(mintedItems),
}))

export const mintedItemsRelations = relations(mintedItems, ({ one }) => ({
    collection: one(collections, {
        fields: [mintedItems.collectionId],
        references: [collections.id],
    }),
    template: one(itemTemplates, {
        fields: [mintedItems.templateId],
        references: [itemTemplates.id],
    }),
    payment: one(payments, {
        fields: [mintedItems.paymentId],
        references: [payments.id],
    }),
}))

export const paymentsRelations = relations(payments, ({ many }) => ({
    mintedItems: many(mintedItems),
}))

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}))

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

export type MintIntent = typeof mintIntents.$inferSelect
export type NewMintIntent = typeof mintIntents.$inferInsert

export const replays = pgTable("replays", {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    playerName: text("player_name").notNull(),
    handle: text("handle"),
    avatarUrl: text("avatar_url"),
    seed: text("seed"),
    events: jsonb("events"),
    finalLevel: integer("final_level").notNull(),
    finalTime: integer("final_time").notNull(),
    gameVersion: text("game_version").notNull(),
    characterId: text("character_id"),
    worldId: text("world_id"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
    index("replays_world_level_time_idx").on(table.worldId, table.finalLevel, table.finalTime),
    index("replays_handle_created_idx").on(table.handle, table.createdAt),
    index("replays_user_world_idx").on(table.userId, table.worldId),
])

export const replaysRelations = relations(replays, ({ one }) => ({
    user: one(users, {
        fields: [replays.userId],
        references: [users.id],
    }),
}))

export type Replay = typeof replays.$inferSelect
export type NewReplay = typeof replays.$inferInsert
export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
})

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert

export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    handle: text("handle").notNull(),
    avatarUrl: text("avatar_url"),
    content: text("content").notNull(),
    parentId: integer("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const commentsRelations = relations(comments, ({ one, many }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "replies",
    }),
    replies: many(comments, {
        relationName: "replies",
    }),
}))

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
