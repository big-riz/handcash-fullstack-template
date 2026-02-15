import { db } from "./db";
import { itemTemplates, mintedItems as mintedItemsTable } from "./schema";
import { eq, sql, or, isNull } from "drizzle-orm";
import { getTemplates } from "./item-templates-storage";

export interface SelectedItem {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
    multimediaUrl?: string;
    pool: string;
    supplyLimit: number;
    attributes?: any;
    description?: string;
    collectionId?: string;
}

/**
 * Shared selection protocol for minting items.
 * 1. Filters items by pool and availability (supply limit).
 * 2. Uses weighted random selection based on remaining supply.
 * 3. Returns an array of selected items.
 */
export async function selectItemsFromPool(poolName: string, quantity: number = 1): Promise<SelectedItem[]> {
    // 1. Get all templates
    const allTemplates = await getTemplates() as any[];

    // 2. Filter by pool OR collection ID
    let poolItems = allTemplates.filter(t => t.pool === poolName || t.collectionId === poolName);

    // Fallback handled by caller if pool is empty, or we can handle here
    if (poolItems.length === 0 && poolName !== "mint2") {
        poolItems = allTemplates.filter(t => t.pool === "mint2" || t.collectionId === "mint2");
    }

    if (poolItems.length === 0) {
        throw new Error(`No items found in pool: ${poolName}`);
    }

    // 3. Get current mint counts from DB
    const mintCounts = await db
        .select({
            templateId: mintedItemsTable.templateId,
            count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(mintedItemsTable)
        .where(eq(mintedItemsTable.isArchived, false))
        .groupBy(mintedItemsTable.templateId);

    const mintCountMap = new Map(
        mintCounts
            .filter(mc => mc.templateId)
            .map(mc => [mc.templateId as string, mc.count])
    );

    const selectedItems: SelectedItem[] = [];

    // We loop for each quantity unit to handle shrinking supply in real-time (though for batch minting it's usually negligible)
    for (let i = 0; i < quantity; i++) {
        // Filter available items based on current selection + DB state
        const availableItems = poolItems.filter(item => {
            const alreadySelectedInThisBatch = selectedItems.filter(si => si.id === item.id).length;
            const mintedInDb = mintCountMap.get(item.id) || 0;
            const totalMinted = mintedInDb + alreadySelectedInThisBatch;

            return item.supplyLimit === 0 || totalMinted < item.supplyLimit;
        });

        if (availableItems.length === 0) {
            if (selectedItems.length > 0) break; // Return what we could get
            throw new Error(`Pool '${poolName}' is sold out!`);
        }

        // Weighted random selection: (Remaining Supply = Weight)
        // For unlimited items, use a default high weight (100)
        const getItemWeight = (item: any) => {
            if (item.supplyLimit === 0) return 100;
            const alreadySelectedInThisBatch = selectedItems.filter(si => si.id === item.id).length;
            const mintedInDb = mintCountMap.get(item.id) || 0;
            return Math.max(1, item.supplyLimit - (mintedInDb + alreadySelectedInThisBatch));
        };

        const totalWeight = availableItems.reduce((acc, item) => acc + getItemWeight(item), 0);
        let randomNum = Math.random() * totalWeight;
        let pickedItem = availableItems[0];

        for (const item of availableItems) {
            randomNum -= getItemWeight(item);
            if (randomNum <= 0) {
                pickedItem = item;
                break;
            }
        }

        selectedItems.push(pickedItem);
    }

    return selectedItems;
}
