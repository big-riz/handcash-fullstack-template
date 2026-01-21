import { db } from "./db"
import { mintedItems } from "./schema"
import { eq, desc } from "drizzle-orm"

export interface MintedItemData {
    id: string
    origin: string
    collectionId?: string
    templateId?: string
    mintedToUserId?: string
    mintedToHandle?: string
    itemName: string
    rarity?: string
    imageUrl?: string
    multimediaUrl?: string
    paymentId?: string
    metadata?: Record<string, any>
}

/**
 * Record a minted item
 * This should be called after successfully minting an item to track it in the database
 */
export async function recordMintedItem(itemData: MintedItemData): Promise<void> {
    try {
        await db.insert(mintedItems).values({
            id: itemData.id,
            origin: itemData.origin,
            collectionId: itemData.collectionId,
            templateId: itemData.templateId,
            mintedToUserId: itemData.mintedToUserId,
            mintedToHandle: itemData.mintedToHandle,
            itemName: itemData.itemName,
            rarity: itemData.rarity,
            imageUrl: itemData.imageUrl,
            multimediaUrl: itemData.multimediaUrl,
            paymentId: itemData.paymentId,
            metadata: itemData.metadata,
        })
    } catch (error) {
        console.error("[MintedItemsStorage] Error recording minted item:", error)
        throw error
    }
}

/**
 * Get minted items by user ID
 */
export async function getMintedItemsByUserId(userId: string): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .where(eq(mintedItems.mintedToUserId, userId))
            .orderBy(desc(mintedItems.mintedAt))

        return results.map((item) => ({
            id: item.id,
            origin: item.origin,
            collectionId: item.collectionId || undefined,
            templateId: item.templateId || undefined,
            mintedToUserId: item.mintedToUserId || undefined,
            mintedToHandle: item.mintedToHandle || undefined,
            itemName: item.itemName,
            rarity: item.rarity || undefined,
            imageUrl: item.imageUrl || undefined,
            multimediaUrl: item.multimediaUrl || undefined,
            paymentId: item.paymentId || undefined,
            metadata: item.metadata as Record<string, any> | undefined,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items by user ID:", error)
        return []
    }
}

/**
 * Get minted items by collection ID
 */
export async function getMintedItemsByCollectionId(collectionId: string): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .where(eq(mintedItems.collectionId, collectionId))
            .orderBy(desc(mintedItems.mintedAt))

        return results.map((item) => ({
            id: item.id,
            origin: item.origin,
            collectionId: item.collectionId || undefined,
            templateId: item.templateId || undefined,
            mintedToUserId: item.mintedToUserId || undefined,
            mintedToHandle: item.mintedToHandle || undefined,
            itemName: item.itemName,
            rarity: item.rarity || undefined,
            imageUrl: item.imageUrl || undefined,
            multimediaUrl: item.multimediaUrl || undefined,
            paymentId: item.paymentId || undefined,
            metadata: item.metadata as Record<string, any> | undefined,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items by collection ID:", error)
        return []
    }
}

/**
 * Get a minted item by origin
 */
export async function getMintedItemByOrigin(origin: string): Promise<MintedItemData | null> {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .where(eq(mintedItems.origin, origin))
            .limit(1)

        if (results.length === 0) return null

        const item = results[0]
        return {
            id: item.id,
            origin: item.origin,
            collectionId: item.collectionId || undefined,
            templateId: item.templateId || undefined,
            mintedToUserId: item.mintedToUserId || undefined,
            mintedToHandle: item.mintedToHandle || undefined,
            itemName: item.itemName,
            rarity: item.rarity || undefined,
            imageUrl: item.imageUrl || undefined,
            multimediaUrl: item.multimediaUrl || undefined,
            paymentId: item.paymentId || undefined,
            metadata: item.metadata as Record<string, any> | undefined,
        }
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted item by origin:", error)
        return null
    }
}

/**
 * Get all minted items
 */
export async function getAllMintedItems(): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .orderBy(desc(mintedItems.mintedAt))

        return results.map((item) => ({
            id: item.id,
            origin: item.origin,
            collectionId: item.collectionId || undefined,
            templateId: item.templateId || undefined,
            mintedToUserId: item.mintedToUserId || undefined,
            mintedToHandle: item.mintedToHandle || undefined,
            itemName: item.itemName,
            rarity: item.rarity || undefined,
            imageUrl: item.imageUrl || undefined,
            multimediaUrl: item.multimediaUrl || undefined,
            paymentId: item.paymentId || undefined,
            metadata: item.metadata as Record<string, any> | undefined,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting all minted items:", error)
        return []
    }
}

/**
 * Get minted items with their template information
 * Uses Drizzle relations to join with itemTemplates
 */
export async function getMintedItemsWithTemplate(userId?: string) {
    try {
        const { itemTemplates } = await import("./schema")

        const query = db
            .select({
                mintedItem: mintedItems,
                template: itemTemplates,
            })
            .from(mintedItems)
            .leftJoin(itemTemplates, eq(mintedItems.templateId, itemTemplates.id))
            .orderBy(desc(mintedItems.mintedAt))

        if (userId) {
            const results = await query.where(eq(mintedItems.mintedToUserId, userId))
            return results
        }

        return await query
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items with template:", error)
        return []
    }
}

/**
 * Get statistics about how many times each template has been minted
 */
export async function getTemplateUsageStats() {
    try {
        const { sql } = await import("drizzle-orm")
        const { itemTemplates } = await import("./schema")

        const results = await db
            .select({
                templateId: mintedItems.templateId,
                templateName: itemTemplates.name,
                mintCount: sql<number>`count(*)::int`,
            })
            .from(mintedItems)
            .leftJoin(itemTemplates, eq(mintedItems.templateId, itemTemplates.id))
            .where(sql`${mintedItems.templateId} IS NOT NULL`)
            .groupBy(mintedItems.templateId, itemTemplates.name)
            .orderBy(sql`count(*) DESC`)

        return results
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting template usage stats:", error)
        return []
    }
}

/**
 * Get all minted items for a specific template
 */
export async function getMintedItemsByTemplateId(templateId: string) {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .where(eq(mintedItems.templateId, templateId))
            .orderBy(desc(mintedItems.mintedAt))

        return results.map((item) => ({
            id: item.id,
            origin: item.origin,
            collectionId: item.collectionId || undefined,
            templateId: item.templateId || undefined,
            mintedToUserId: item.mintedToUserId || undefined,
            mintedToHandle: item.mintedToHandle || undefined,
            itemName: item.itemName,
            rarity: item.rarity || undefined,
            imageUrl: item.imageUrl || undefined,
            multimediaUrl: item.multimediaUrl || undefined,
            paymentId: item.paymentId || undefined,
            metadata: item.metadata as Record<string, any> | undefined,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items by template:", error)
        return []
    }
}
