
import 'dotenv/config'
import { db } from '../lib/db'
import { itemTemplates } from '../lib/schema'
import { eq } from 'drizzle-orm'

async function main() {
    const item = await db.query.itemTemplates.findFirst({
        where: eq(itemTemplates.id, 'samogon-still-mint2')
    });
    console.log("Samogon Still DB Data:", JSON.stringify(item, null, 2));
}

main();
