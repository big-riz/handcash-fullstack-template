
import 'dotenv/config'
import { db } from '../lib/db'
import { mintIntents, mintedItems, payments } from '../lib/schema'
import { eq, like, desc, and, gt } from 'drizzle-orm'

async function main() {
    const args = process.argv.slice(2)
    const handleArg = args.find(a => a.startsWith('--handle='))?.split('=')[1]
    const intentIdArg = args.find(a => a.startsWith('--intentId='))?.split('=')[1]
    const dryRun = !args.includes('--force')

    if (!handleArg && !intentIdArg) {
        console.error('Usage: tsx scripts/delete-mint-data.ts --handle=<handle> [--intentId=<uuid>] [--force]')
        console.error('       --force: Actually delete records (default is dry-run)')
        process.exit(1)
    }

    console.log(`\n🔍 Searching for mint data...`)
    if (handleArg) console.log(`   Handle: ${handleArg}`)
    if (intentIdArg) console.log(`   Intent ID: ${intentIdArg}`)
    console.log(`   Mode: ${dryRun ? 'DRY RUN (No changes)' : 'DELETING'}\n`)

    try {
        // 1. Find Mint Intents
        const intentsQuery = db
            .select()
            .from(mintIntents)
            .orderBy(desc(mintIntents.createdAt))

        let intents = await intentsQuery

        // Filter in memory or add where clauses if needed (handle is text, so simpler to fetch and filter for small sets, 
        // but robustly we should use .where)
        // Adjusting query based on args:
        const whereConditions = []
        if (handleArg) whereConditions.push(eq(mintIntents.handle, handleArg))
        if (intentIdArg) whereConditions.push(eq(mintIntents.id, intentIdArg))

        const targetIntents = await db.query.mintIntents.findMany({
            where: and(...whereConditions),
            orderBy: desc(mintIntents.createdAt)
        })

        console.log(`Found ${targetIntents.length} Mint Intents:`)

        const paymentIdsToDelete: string[] = []
        const paymentRequestsToDelete: string[] = []
        const intentIdsToDelete: string[] = []

        for (const intent of targetIntents) {
            console.log(` - [${intent.status}] ID: ${intent.id} | Created: ${intent.createdAt} | PR: ${intent.paymentRequestId}`)
            intentIdsToDelete.push(intent.id)
            if (intent.paymentRequestId) paymentRequestsToDelete.push(intent.paymentRequestId)
        }

        // 2. Find Minted Items linked to these intents or handle?
        // Note: MintIntents track the process. MintedItems are the result.
        // There isn't a direct FK from mintedItems to mintIntents, but they share paymentId or we can look up by handle+time.
        // However, looking at schema: mintedItems has `paymentId`. mintIntents has `paymentRequestId`. 
        // Payments table links `paymentRequestId` <-> `id`.

        // Let's find Payments associated with the Mint Intents
        const targetPayments = await db.query.payments.findMany({
            where: (payments, { inArray }) =>
                paymentRequestsToDelete.length > 0
                    ? inArray(payments.paymentRequestId, paymentRequestsToDelete)
                    : undefined
        })

        console.log(`\nFound ${targetPayments.length} Payments linked to these intents:`)
        for (const p of targetPayments) {
            console.log(` - ID: ${p.id} | Amount: ${p.amount} ${p.currency} | Status: ${p.status}`)
            paymentIdsToDelete.push(p.id)
        }

        // 3. Find Minted Items (linked by Payment ID)
        // If we found payments, we can find minted items. 
        // If no payments found (e.g. pending_payment intent), we might still want to check for items by handle if user requested.
        // But "Targeted deletion" implies deleting strictly related stuff.

        // Also check for minted items by handle that might not be linked to these specific intents (orphaned?) 
        // if user only specified handle? 
        // For safety, let's stick to the cascade from the Intent -> Payment -> Item if Intent ID was provided.
        // If only Handle provided, we should probably query Minted Items by handle too.

        let targetItems: any[] = []
        if (paymentIdsToDelete.length > 0) {
            targetItems = await db.query.mintedItems.findMany({
                where: (items, { inArray }) => inArray(items.paymentId, paymentIdsToDelete)
            })
        }

        // If only handle provided, maybe we want ALL items for that handle?
        // Let's ask user to be specific or just delete what is linked to the Intents found.
        // "Targeted deletion" usually means "I want to undo *this* action".

        console.log(`\nFound ${targetItems.length} Minted Items linked to these payments:`)
        for (const item of targetItems) {
            console.log(` - ID: ${item.id} | Name: ${item.itemName} | Origin: ${item.origin}`)
        }

        if (!dryRun) {
            console.log(`\n⚠️  DELETING RECORDS...`)

            // Delete Minted Items
            if (targetItems.length > 0) {
                // Using simple loop for safety or inArray
                const itemIds = targetItems.map(i => i.id)
                // Delete Minted Items via loop

                for (const item of targetItems) {
                    await db.delete(mintedItems).where(eq(mintedItems.id, item.id))
                }
                console.log(`   Deleted ${targetItems.length} Minted Items.`)
            }

            // Delete Mint Intents
            if (intentIdsToDelete.length > 0) {
                for (const id of intentIdsToDelete) {
                    await db.delete(mintIntents).where(eq(mintIntents.id, id))
                }
                console.log(`   Deleted ${intentIdsToDelete.length} Mint Intents.`)
            }

            // Delete Payments
            if (paymentIdsToDelete.length > 0) {
                for (const id of paymentIdsToDelete) {
                    await db.delete(payments).where(eq(payments.id, id))
                }
                console.log(`   Deleted ${paymentIdsToDelete.length} Payments.`)
            }

            console.log(`\n✅ Cleanup complete.`)

        } else {
            console.log(`\nℹ️  Run with --force to execute deletion.`)
        }

    } catch (error) {
        console.error('Error during cleanup:', error)
    }
}

main()
