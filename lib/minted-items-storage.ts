import { db } from "./db"
import { mintedItems, itemTemplates } from "./schema"
import { eq, desc, and } from "drizzle-orm"

const mintedItemColumns = {
    id: mintedItems.id,
    origin: mintedItems.origin,
    collectionId: mintedItems.collectionId,
    templateId: mintedItems.templateId,
    mintedToUserId: mintedItems.mintedToUserId,
    mintedToHandle: mintedItems.mintedToHandle,
    itemName: mintedItems.itemName,
    rarity: mintedItems.rarity,
    imageUrl: mintedItems.imageUrl,
    paymentId: mintedItems.paymentId,
    mintedAt: mintedItems.mintedAt,
    isArchived: mintedItems.isArchived,
}

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
    isArchived?: boolean
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
            isArchived: itemData.isArchived || false,
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
export async function getMintedItemsByUserId(userId: string, includeArchived = false): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select(mintedItemColumns)
            .from(mintedItems)
            .where(
                and(
                    eq(mintedItems.mintedToUserId, userId),
                    includeArchived ? undefined : eq(mintedItems.isArchived, false)
                )
            )
            .orderBy(desc(mintedItems.mintedAt))
            .limit(200)

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
            paymentId: item.paymentId || undefined,
            isArchived: item.isArchived || false,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items by user ID:", error)
        return []
    }
}

/**
 * Get minted items by collection ID
 */
export async function getMintedItemsByCollectionId(collectionId: string, includeArchived = false): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select(mintedItemColumns)
            .from(mintedItems)
            .where(
                and(
                    eq(mintedItems.collectionId, collectionId),
                    includeArchived ? undefined : eq(mintedItems.isArchived, false)
                )
            )
            .orderBy(desc(mintedItems.mintedAt))
            .limit(500)

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
            paymentId: item.paymentId || undefined,
            isArchived: item.isArchived || false,
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
            isArchived: item.isArchived || false,
            metadata: item.metadata as Record<string, any> | undefined,
        }
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted item by origin:", error)
        return null
    }
}

/**
 * Get all minted items (paginated)
 */
export async function getAllMintedItems(includeArchived = false, limit = 100, offset = 0): Promise<MintedItemData[]> {
    try {
        const results = await db
            .select()
            .from(mintedItems)
            .where(includeArchived ? undefined : eq(mintedItems.isArchived, false))
            .orderBy(desc(mintedItems.mintedAt))
            .limit(limit)
            .offset(offset)

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
            isArchived: item.isArchived || false,
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
export async function getMintedItemsWithTemplate(userId?: string, includeArchived = false) {
    try {
        const selectColumns = {
            mintedItem: mintedItemColumns,
            template: {
                id: itemTemplates.id,
                name: itemTemplates.name,
                imageUrl: itemTemplates.imageUrl,
                rarity: itemTemplates.rarity,
                color: itemTemplates.color,
                pool: itemTemplates.pool,
                supplyLimit: itemTemplates.supplyLimit,
                collectionId: itemTemplates.collectionId,
            },
        }

        if (userId) {
            const results = await db
                .select(selectColumns)
                .from(mintedItems)
                .leftJoin(itemTemplates, eq(mintedItems.templateId, itemTemplates.id))
                .where(
                    and(
                        eq(mintedItems.mintedToUserId, userId),
                        includeArchived ? undefined : eq(mintedItems.isArchived, false)
                    )
                )
                .orderBy(desc(mintedItems.mintedAt))
                .limit(500)
            return results
        }

        return await db
            .select(selectColumns)
            .from(mintedItems)
            .leftJoin(itemTemplates, eq(mintedItems.templateId, itemTemplates.id))
            .where(includeArchived ? undefined : eq(mintedItems.isArchived, false))
            .orderBy(desc(mintedItems.mintedAt))
            .limit(500)
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
            .where(
                and(
                    sql`${mintedItems.templateId} IS NOT NULL`,
                    eq(mintedItems.isArchived, false)
                )
            )
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
export async function getMintedItemsByTemplateId(templateId: string, includeArchived = false) {
    try {
        const results = await db
            .select(mintedItemColumns)
            .from(mintedItems)
            .where(
                and(
                    eq(mintedItems.templateId, templateId),
                    includeArchived ? undefined : eq(mintedItems.isArchived, false)
                )
            )
            .orderBy(desc(mintedItems.mintedAt))
            .limit(500)

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
            paymentId: item.paymentId || undefined,
            isArchived: item.isArchived || false,
        }))
    } catch (error) {
        console.error("[MintedItemsStorage] Error getting minted items by template:", error)
        return []
    }
}
