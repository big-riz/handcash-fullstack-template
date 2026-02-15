
import { db } from "../lib/db";
import { mintedItems } from "../lib/schema";
import { eq, or } from "drizzle-orm";

async function main() {
    const targetId = "69912eda798fa5633307a932";
    console.log(`Checking 'minted_items' table for ID matching: ${targetId}`);

    const item = await db.query.mintedItems.findFirst({
        where: or(
            eq(mintedItems.id, targetId),
            eq(mintedItems.origin, targetId)
        )
    });

    if (item) {
        console.log("Found in 'minted_items' table:", JSON.stringify(item, null, 2));
    } else {
        console.log("Not found in 'minted_items' table.");
    }
    process.exit(0);
}

main().catch(err => {
    console.error("Error checking minted_items:", err);
    process.exit(1);
});
