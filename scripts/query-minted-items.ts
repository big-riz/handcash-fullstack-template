import dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

// Load environment variables FIRST
dotenv.config()

async function queryMintedItems() {
    try {
        // Dynamic import after dotenv is loaded
        const { db } = await import("../lib/db")
        const { mintedItems } = await import("../lib/schema")

        console.log("Querying minted items from database...")

        // Query all minted items (including archived)
        const items = await db
            .select()
            .from(mintedItems)

        console.log(`Found ${items.length} minted items`)

        // Export to CSV
        const csvPath = path.join(process.cwd(), "minted-items-export.csv")
        const csvHeaders = [
            "id",
            "origin",
            "collectionId",
            "templateId",
            "mintedToUserId",
            "mintedToHandle",
            "itemName",
            "rarity",
            "imageUrl",
            "multimediaUrl",
            "paymentId",
            "mintedAt",
            "isArchived"
        ]

        const csvRows = items.map(item => [
            item.id,
            item.origin,
            item.collectionId || "",
            item.templateId || "",
            item.mintedToUserId || "",
            item.mintedToHandle || "",
            item.itemName,
            item.rarity || "",
            item.imageUrl || "",
            item.multimediaUrl || "",
            item.paymentId || "",
            item.mintedAt?.toISOString() || "",
            item.isArchived || false
        ])

        const csvContent = [
            csvHeaders.join(","),
            ...csvRows.map(row => row.map(cell =>
                typeof cell === 'string' && cell.includes(',')
                    ? `"${cell}"`
                    : cell
            ).join(","))
        ].join("\n")

        fs.writeFileSync(csvPath, csvContent, "utf-8")
        console.log(`\nCSV exported to: ${csvPath}`)
        console.log(`Total rows: ${csvRows.length}`)

        // Process for unique handles
        const handles = items
            .map(item => item.mintedToHandle)
            .filter(handle => handle != null && handle !== "")

        const uniqueHandles = [...new Set(handles)]
        uniqueHandles.sort()

        console.log(`\n=== UNIQUE HANDLES ===`)
        console.log(`Total unique handles: ${uniqueHandles.length}`)
        console.log(`\n1-Dimensional List:`)
        console.log(JSON.stringify(uniqueHandles, null, 2))

        // Also save to file
        const handlesPath = path.join(process.cwd(), "unique-handles.json")
        fs.writeFileSync(handlesPath, JSON.stringify(uniqueHandles, null, 2), "utf-8")
        console.log(`\nUnique handles saved to: ${handlesPath}`)

        // Print detailed stats
        console.log(`\n=== STATISTICS ===`)
        console.log(`Total minted items: ${items.length}`)
        console.log(`Items with handles: ${handles.length}`)
        console.log(`Items without handles: ${items.length - handles.length}`)
        console.log(`Unique handles: ${uniqueHandles.length}`)

        // Count items per owner
        const itemsPerOwner: Record<string, number> = {}
        items.forEach(item => {
            const handle = item.mintedToHandle || "UNKNOWN"
            itemsPerOwner[handle] = (itemsPerOwner[handle] || 0) + 1
        })

        // Sort by count descending
        const sortedOwners = Object.entries(itemsPerOwner)
            .sort((a, b) => b[1] - a[1])

        console.log(`\n=== ITEMS PER OWNER ===`)
        sortedOwners.forEach(([handle, count]) => {
            console.log(`${handle}: ${count}`)
        })

        // Save to JSON file
        const ownerCountsPath = path.join(process.cwd(), "items-per-owner.json")
        const ownerCountsData = Object.fromEntries(sortedOwners)
        fs.writeFileSync(ownerCountsPath, JSON.stringify(ownerCountsData, null, 2), "utf-8")
        console.log(`\nItems per owner saved to: ${ownerCountsPath}`)

    } catch (error) {
        console.error("Error querying minted items:", error)
        process.exit(1)
    }
}

queryMintedItems()
