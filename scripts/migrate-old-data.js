#!/usr/bin/env node

/**
 * Data Migration Script
 * 
 * This script migrates data from the old JSON file storage to the new Neon database.
 * Run this once after setting up the database to preserve existing data.
 * 
 * Usage: node scripts/migrate-old-data.js
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { db } from '../lib/db.js'
import { payments, collections, itemTemplates } from '../lib/schema.js'

const DATA_DIR = join(process.cwd(), 'data')

async function migratePayments() {
    const paymentsFile = join(DATA_DIR, 'payments.json')

    if (!existsSync(paymentsFile)) {
        console.log('⏭️  No payments.json found, skipping...')
        return
    }

    try {
        const data = JSON.parse(readFileSync(paymentsFile, 'utf-8'))

        if (!Array.isArray(data) || data.length === 0) {
            console.log('⏭️  payments.json is empty, skipping...')
            return
        }

        console.log(`📦 Migrating ${data.length} payments...`)

        for (const payment of data) {
            await db.insert(payments).values({
                id: payment.id,
                paymentRequestId: payment.paymentRequestId,
                transactionId: payment.transactionId,
                amount: payment.amount.toString(),
                currency: payment.currency,
                paidBy: payment.paidBy,
                paidAt: new Date(payment.paidAt),
                status: payment.status,
                metadata: payment.metadata,
            }).onConflictDoNothing()
        }

        console.log('✅ Payments migrated successfully')
    } catch (error) {
        console.error('❌ Error migrating payments:', error)
    }
}

async function migrateCollections() {
    const collectionsFile = join(DATA_DIR, 'collections.json')

    if (!existsSync(collectionsFile)) {
        console.log('⏭️  No collections.json found, skipping...')
        return
    }

    try {
        const data = JSON.parse(readFileSync(collectionsFile, 'utf-8'))

        if (!Array.isArray(data) || data.length === 0) {
            console.log('⏭️  collections.json is empty, skipping...')
            return
        }

        console.log(`📦 Migrating ${data.length} collections...`)

        for (const collection of data) {
            await db.insert(collections).values({
                id: collection.id,
                name: collection.name,
                description: collection.description,
                imageUrl: collection.imageUrl,
                createdAt: new Date(collection.createdAt),
                updatedAt: collection.updatedAt ? new Date(collection.updatedAt) : null,
            }).onConflictDoNothing()
        }

        console.log('✅ Collections migrated successfully')
    } catch (error) {
        console.error('❌ Error migrating collections:', error)
    }
}

async function migrateItemTemplates() {
    const templatesFile = join(DATA_DIR, 'item-templates.json')

    if (!existsSync(templatesFile)) {
        console.log('⏭️  No item-templates.json found, skipping...')
        return
    }

    try {
        const data = JSON.parse(readFileSync(templatesFile, 'utf-8'))

        if (!Array.isArray(data) || data.length === 0) {
            console.log('⏭️  item-templates.json is empty, skipping...')
            return
        }

        console.log(`📦 Migrating ${data.length} item templates...`)

        for (const template of data) {
            await db.insert(itemTemplates).values({
                id: template.id,
                name: template.name,
                description: template.description,
                imageUrl: template.imageUrl,
                multimediaUrl: template.multimediaUrl,
                collectionId: template.collectionId,
                attributes: template.attributes,
                rarity: template.rarity,
                color: template.color,
                createdAt: new Date(template.createdAt),
                updatedAt: template.updatedAt ? new Date(template.updatedAt) : null,
            }).onConflictDoNothing()
        }

        console.log('✅ Item templates migrated successfully')
    } catch (error) {
        console.error('❌ Error migrating item templates:', error)
    }
}

async function main() {
    console.log('🚀 Starting data migration from JSON files to database...\n')

    if (!existsSync(DATA_DIR)) {
        console.log('❌ No data/ directory found. Nothing to migrate.')
        process.exit(0)
    }

    await migrateCollections()
    await migrateItemTemplates()
    await migratePayments()

    console.log('\n✨ Migration complete!')
    console.log('\n📝 Note: Audit logs are not migrated as they are append-only.')
    console.log('   The old audit.log files are preserved in data/ for reference.')

    process.exit(0)
}

main().catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
})
