import "dotenv/config";
import { db } from "../lib/db";
import { itemTemplates, mintedItems as mintedItemsTable } from "../lib/schema";
import { getTemplates } from "../lib/item-templates-storage";
import { sql } from "drizzle-orm";

async function simulate() {
    console.log("--- Mint Selection Simulation ---");

    // 1. Fetch Templates
    const allTemplates = await getTemplates();
    if (allTemplates.length === 0) {
        console.log("No templates found in database. Exiting.");
        process.exit(0);
    }

    // 2. Fetch Mint Counts
    const mintCounts = await db
        .select({
            templateId: mintedItemsTable.templateId,
            count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(mintedItemsTable)
        .groupBy(mintedItemsTable.templateId);

    const mintCountMap = new Map(mintCounts.map(mc => [mc.templateId, mc.count]));

    // 3. Define the Weighted Logic (same as route.ts)
    const getItemWeight = (item: any) => {
        if (item.supplyLimit === 0) return 100;
        const minted = item.id ? (mintCountMap.get(item.id) || 0) : 0;
        return Math.max(1, (item.supplyLimit || 0) - minted);
    };

    // 4. Group by Pool for a better report
    const pools = Array.from(new Set(allTemplates.map(t => t.pool || "default")));

    for (const poolName of pools) {
        console.log(`\nSimulating pool: ${poolName}`);

        // Filter items for this pool and check supply
        const poolItems = allTemplates.filter(t => (t.pool || "default") === poolName);
        const availableItems = poolItems.filter(item => {
            const minted = mintCountMap.get(item.id) || 0;
            return item.supplyLimit === 0 || minted < (item.supplyLimit || 0);
        });

        if (availableItems.length === 0) {
            console.log(`  Pool '${poolName}' is sold out.`);
            continue;
        }

        // Prepare Results Tracking
        const results = new Map<string, number>();
        availableItems.forEach(item => results.set(item.name, 0));

        const rollCount = 1000;
        console.log(`  Running ${rollCount} iterations...`);

        // Run Simulation
        for (let i = 0; i < rollCount; i++) {
            const totalWeight = availableItems.reduce((acc, item) => acc + getItemWeight(item), 0);
            let randomNum = Math.random() * totalWeight;
            let selectedItem = availableItems[0];

            for (const item of availableItems) {
                randomNum -= getItemWeight(item);
                if (randomNum <= 0) {
                    selectedItem = item;
                    break;
                }
            }
            results.set(selectedItem.name, (results.get(selectedItem.name) || 0) + 1);
        }

        // Print Results
        console.log(`  %-30s | %-15s | %-10s | %-10s | %-10s`.replace(/%/g, ""), "Item Name", "Remaining/Limit", "Weight", "Rolls", "Prob %");
        console.log("-".repeat(85));

        availableItems
            .sort((a, b) => getItemWeight(b) - getItemWeight(a))
            .forEach(item => {
                const minted = mintCountMap.get(item.id) || 0;
                const weight = getItemWeight(item);
                const rolls = results.get(item.name) || 0;
                const prob = ((rolls / rollCount) * 100).toFixed(1);
                const supplyStr = item.supplyLimit === 0 ? "Unlimited" : `${(item.supplyLimit || 0) - minted}/${item.supplyLimit}`;

                console.log(
                    `${item.name.padEnd(30)} | ${supplyStr.padEnd(15)} | ${weight.toString().padEnd(10)} | ${rolls.toString().padEnd(10)} | ${prob}%`
                );
            });
    }
}

simulate().catch(err => {
    console.error("Simulation failed:", err);
    process.exit(1);
});
