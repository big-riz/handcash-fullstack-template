
import 'dotenv/config'
import { db } from '../lib/db'
import { collections } from '../lib/schema'

async function main() {
    const allCollections = await db.select().from(collections);
    console.log("Collections in DB:", JSON.stringify(allCollections, null, 2));
}

main();
