import { resolve } from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: resolve(process.cwd(), ".env.local") })

import { sql } from "drizzle-orm"
import { itemTemplates } from "../lib/schema"

const TARGET_COLLECTION_ID = "6973cd7135f5681f98ce551c"

async function run() {
  const { db } = await import("../lib/db")
  console.log("🔧 Updating item templates collection ID...")

  const before = await db.select({ count: sql<number>`count(*)` }).from(itemTemplates)
  console.log(`Found ${before[0]?.count ?? 0} item templates.`)

  await db
    .update(itemTemplates)
    .set({
      collectionId: TARGET_COLLECTION_ID,
      updatedAt: new Date(),
    })

  const after = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemTemplates)
    .where(sql`collection_id = ${TARGET_COLLECTION_ID}`)

  console.log(`✅ Updated ${after[0]?.count ?? 0} templates to collection ${TARGET_COLLECTION_ID}.`)
}

run().catch((error) => {
  console.error("💥 Failed to update item templates:", error)
  process.exit(1)
})
