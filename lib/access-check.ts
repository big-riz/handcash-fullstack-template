import { handcashService } from "./handcash-service"
import { getSetting } from "./settings-storage"

/**
 * Checks if a user possesses an item from any of the collections in our precomputed authorized list.
 * The list is synced via scripts/sync-authorized-collections.ts and stored in settings.
 * 
 * @param privateKey The HandCash private key (auth token)
 * @returns Object with success, authorized, and reason
 */
export async function checkCollectionAccess(privateKey: string) {
    try {
        // 1. Fetch precomputed collection IDs from settings
        const precomputedIdsJson = await getSetting("authorized_collection_ids")

        if (!precomputedIdsJson) {
            console.warn("[Access Check] No precomputed collection IDs found. Defaulting to deny.")
            return {
                success: true,
                authorized: false,
                reason: "Access requirements have not been configured. Please contact admin.",
                validCollectionIds: []
            }
        }

        let validCollectionIds: string[] = []
        try {
            validCollectionIds = JSON.parse(precomputedIdsJson)
        } catch (e) {
            console.error("[Access Check] Failed to parse precomputed IDs:", e)
            return {
                success: false,
                authorized: false,
                reason: "Internal configuration error."
            }
        }

        const validIdsSet = new Set(validCollectionIds)

        if (validIdsSet.size === 0) {
            return {
                success: true,
                authorized: false,
                reason: "No authorized collections found. Please contact admin.",
                validCollectionIds: []
            }
        }

        // 2. Check user inventory
        const inventory = await handcashService.getInventory(privateKey)

        const matchingItem = inventory.find((item: any) => {
            const collectionId = item.collection?.id
            return collectionId && validIdsSet.has(collectionId)
        })

        const hasItem = !!matchingItem

        if (hasItem) {
            console.log(`[Access Check] Access granted via item: ${matchingItem.name} (${matchingItem.collection?.name})`)
        }

        return {
            success: true,
            authorized: hasItem,
            validCollectionIds: validCollectionIds,
            reason: hasItem ? null : "You must own an item from one of our collections to gain access."
        }
    } catch (error: any) {
        console.error("[Access Check Utility] Error:", error)
        return {
            success: false,
            authorized: false,
            reason: "Failed to verify collection access",
            error: error.message
        }
    }
}
