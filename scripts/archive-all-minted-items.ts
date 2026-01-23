import { resolve } from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: resolve(process.cwd(), ".env.local") })

import { sql } from "drizzle-orm"
import { mintedItems } from "../lib/schema"

async function run() {
  const { db } = await import("../lib/db")
  console.log("🗃️  Archiving all minted items...")

  const before = await db.select({ count: sql<number>`count(*)` }).from(mintedItems)
  console.log(`Found ${before[0]?.count ?? 0} minted items.`)

  await db.update(mintedItems).set({ isArchived: true })

  const after = await db
    .select({ count: sql<number>`count(*)` })
    .from(mintedItems)
    .where(sql`is_archived = true`)

  console.log(`✅ Archived ${after[0]?.count ?? 0} minted items.`)
}

run().catch((error) => {
  console.error("💥 Failed to archive minted items:", error)
  process.exit(1)
})
