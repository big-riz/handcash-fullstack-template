import 'dotenv/config';
import { setSetting } from "../lib/settings-storage";

async function forceSet() {
    const rawIds = "67001c8fd30a0d5f09878b96 65f3e89bee2e77a2acfe54f7 675e0ad58a60ac25bb3ee0dc 6756ffca8a60ac25bbdd3691 673c98526955250cc4637b4d 6973cd7135f5681f98ce551c 6720f6296955250cc4e849ba 66bba8deaca8a26bc55ac9c6 6973d88c35f5681f98ce5538";
    const idList = rawIds.split(/\s+/).filter(id => id.length > 0);

    // Deduplicate
    const uniqueIds = Array.from(new Set(idList));

    console.log(`Setting ${uniqueIds.length} authorized collection IDs...`);
    await setSetting("authorized_collection_ids", JSON.stringify(uniqueIds));
    console.log("✅ Successfully updated authorized_collection_ids.");
}

forceSet().catch(console.error);
