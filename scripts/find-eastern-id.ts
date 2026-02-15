
import 'dotenv/config'
import { getMinter } from '../lib/items-client'

async function main() {
    try {
        const minter = getMinter();
        console.log("Checking for 'Eastern Treasure' collection...");

        // HandCashMinter usually doesn't have a simple "get all collections" for privacy/API design reasons?
        // Let's check some common methods.
        // Actually, many minters have `getCollections()`.

        const anyMinter = minter as any;
        if (typeof anyMinter.getCollections === 'function') {
            const collections = await anyMinter.getCollections();
            console.log("Collections:", JSON.stringify(collections, null, 2));
        } else {
            console.log("minter.getCollections is not a function. Methods:", Object.keys(anyMinter));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
