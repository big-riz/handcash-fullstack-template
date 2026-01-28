import dotenv from "dotenv"
dotenv.config()

async function selectRandomHolders() {
    const { db } = await import("../lib/db")
    const { mintedItems } = await import("../lib/schema")

    const items = await db.select().from(mintedItems)

    const holders = [
        ...new Set(
            items
                .map(i => i.mintedToHandle)
                .filter((h): h is string => h != null && h !== "")
        ),
    ]

    console.log(`Total unique holders: ${holders.length}`)
    console.log(`All holders:`, holders)

    // Fisher-Yates shuffle
    for (let i = holders.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[holders[i], holders[j]] = [holders[j], holders[i]]
    }

    const selected = holders.slice(0, 8)
    const dieGlocke = selected.slice(0, 3)
    const flyingLada = selected.slice(3, 8)

    console.log(`\n=== RANDOM SELECTION (8 of ${holders.length}) ===`)
    console.log(`\nDie Glocke (3):`)
    dieGlocke.forEach(h => console.log(`  ${h}`))
    console.log(`\nFlying Lada (5):`)
    flyingLada.forEach(h => console.log(`  ${h}`))

    process.exit(0)
}

selectRandomHolders()
