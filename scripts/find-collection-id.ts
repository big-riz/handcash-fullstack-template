
import 'dotenv/config'
import { handcashService } from '../lib/handcash-service'

async function main() {
    const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN;

    if (!businessAuthToken) {
        console.error("Missing BUSINESS_AUTH_TOKEN in .env");
        process.exit(1);
    }

    try {
        console.log("Fetching inventory via HandCash Service...");

        const inventory = await handcashService.getInventory(businessAuthToken);

        const collectionsFound = new Map<string, string>();

        for (const item of inventory) {
            if (item.collection) {
                collectionsFound.set(item.collection.id, item.collection.name);
            }
        }

        console.log("\n--- Collections Found in Business Inventory ---");
        if (collectionsFound.size === 0) {
            console.log("No collections found in inventory items.");
        }
        for (const [id, name] of collectionsFound) {
            console.log(`ID: ${id} | Name: ${name}`);
        }

    } catch (error) {
        console.error("Error fetching info:", error);
    }
}

main();
