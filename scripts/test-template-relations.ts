/**
 * Test script to verify template-minted item relationships
 * Run with: npx tsx scripts/test-template-relations.ts
 */

import { db } from "./lib/db.js"
import { itemTemplates, mintedItems } from "./lib/schema.js"
import { eq } from "drizzle-orm"
import { getMintedItemsWithTemplate, getTemplateUsageStats, getMintedItemsByTemplateId } from "./lib/minted-items-storage.js"

async function testTemplateRelations() {
    console.log("🔍 Testing Template-Minted Item Relations\n")

    // 1. Check all templates
    console.log("📋 All Item Templates:")
    const templates = await db.select().from(itemTemplates)
    console.log(`Found ${templates.length} templates:`)
    templates.forEach(t => {
        console.log(`  - ${t.name} (ID: ${t.id})`)
    })
    console.log()

    // 2. Check all minted items
    console.log("🎁 All Minted Items:")
    const minted = await db.select().from(mintedItems)
    console.log(`Found ${minted.length} minted items:`)
    minted.forEach(m => {
        console.log(`  - ${m.itemName} (Template ID: ${m.templateId || 'NONE'})`)
    })
    console.log()

    // 3. Test getMintedItemsWithTemplate
    console.log("🔗 Minted Items WITH Template Data:")
    const itemsWithTemplates = await getMintedItemsWithTemplate()
    console.log(`Found ${itemsWithTemplates.length} items with template joins:`)
    itemsWithTemplates.forEach(({ mintedItem, template }) => {
        console.log(`  - ${mintedItem.itemName}`)
        console.log(`    Template: ${template?.name || 'NO TEMPLATE'}`)
        console.log(`    Template ID: ${mintedItem.templateId || 'NONE'}`)
    })
    console.log()

    // 4. Test getTemplateUsageStats
    console.log("📊 Template Usage Statistics:")
    const stats = await getTemplateUsageStats()
    if (stats.length === 0) {
        console.log("  ⚠️  No templates have been minted yet (or templateId is not being saved)")
    } else {
        stats.forEach(({ templateName, mintCount }) => {
            console.log(`  - ${templateName}: ${mintCount} mints`)
        })
    }
    console.log()

    // 5. Check for orphaned minted items (no template ID)
    const orphaned = minted.filter(m => !m.templateId)
    if (orphaned.length > 0) {
        console.log("⚠️  Orphaned Minted Items (no template ID):")
        orphaned.forEach(m => {
            console.log(`  - ${m.itemName} (Origin: ${m.origin})`)
        })
        console.log()
    }

    console.log("✅ Test complete!")
}

testTemplateRelations()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("❌ Error:", err)
        process.exit(1)
    })
