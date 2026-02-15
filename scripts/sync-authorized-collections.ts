import { db } from "../lib/db";
import { collections } from "../lib/schema";
import { getAccountClient, getMinter, Connect } from "../lib/items-client";
import { setSetting, getSetting } from "../lib/settings-storage";

async function syncAuthorizedCollections() {
    console.log("🔄 Syncing authorized collections...");

    const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN;
    if (!businessAuthToken) {
        console.error("❌ BUSINESS_AUTH_TOKEN not configured");
        process.exit(1);
    }

    const validCollectionIds = new Set<string>();

    // 0. Load existing IDs to preserve manual changes
    try {
        const existing = await getSetting("authorized_collection_ids");
        if (existing) {
            const list = JSON.parse(existing);
            if (Array.isArray(list)) {
                list.forEach(id => validCollectionIds.add(id));
                console.log(`📜 Loaded ${list.length} existing IDs to preserve.`);
            }
        }
    } catch (e) {
        console.warn("⚠️ Failed to load existing IDs:", e);
    }


    // 1. Fetch from Minter (all collections created by this app)
    try {
        console.log("🛠️ Fetching collections from Minter...");
        const minter = getMinter();
        // In @handcash/handcash-connect, minter.getCollections() returns all collections
        const myCollections = await (minter as any).getCollections();

        let minterCount = 0;
        if (Array.isArray(myCollections)) {
            for (const col of myCollections) {
                if (col?.id) {
                    validCollectionIds.add(col.id);
                    minterCount++;
                }
            }
        }
        console.log(`✅ Found ${minterCount} collections from HandCash Minter.`);
    } catch (err) {
        console.warn("⚠️ Minter fetch failed (might not be supported in this SDK version):", err instanceof Error ? err.message : err);
    }

    // 2. Fetch from Business Inventory (Admin-style logic)
    try {
        console.log("📦 Fetching business inventory...");
        const accountClient = getAccountClient(businessAuthToken);
        const { data, error } = await Connect.getItemsInventory({
            client: accountClient as any,
            body: {},
        });

        if (!error) {
            const items = (data as any)?.items || (Array.isArray(data) ? data : []);
            let apiCount = 0;
            for (const item of items) {
                if (item?.collection?.id) {
                    if (!validCollectionIds.has(item.collection.id)) {
                        validCollectionIds.add(item.collection.id);
                        apiCount++;
                    }
                }
            }
            console.log(`✅ Added ${apiCount} unique collections from business inventory.`);
        }
    } catch (err) {
        console.error("💥 Error during inventory fetch:", err);
    }

    // 3. Fetch from local database
    try {
        console.log("🗄️ Fetching collections from local database...");
        const dbCollections = await db.select().from(collections);
        let dbCount = 0;
        for (const c of dbCollections) {
            if (!validCollectionIds.has(c.id)) {
                validCollectionIds.add(c.id);
                dbCount++;
            }
        }
        console.log(`✅ Added ${dbCount} additional collections from local database.`);
    } catch (err) {
        console.error("💥 Error during DB fetch:", err);
    }

    const idList = Array.from(validCollectionIds);
    console.log(`📊 Total authorized collection IDs: ${idList.length}`);
    if (idList.length > 0) {
        console.log("IDs:", idList.join(", "));
    }

    try {
        await setSetting("authorized_collection_ids", JSON.stringify(idList));
        console.log("✨ Successfully precomputed and saved authorized collection IDs to settings.");
    } catch (err) {
        console.error("❌ Failed to save to settings:", err);
    }

    console.log("Done.");
}

syncAuthorizedCollections().catch(err => {
    console.error("💥 Fatal error during sync:", err);
    process.exit(1);
});
