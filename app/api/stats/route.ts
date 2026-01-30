import { db } from "@/lib/db"
import { mintedItems, payments } from "@/lib/schema"
import { NextResponse } from "next/server"
import { sql, and, not, ilike, eq } from "drizzle-orm"
import { handcashService } from "@/lib/handcash-service"
import { getCached, setCache } from "@/lib/cache"

export async function GET() {
    const cached = getCached<any>("stats")
    if (cached) return NextResponse.json(cached)

    try {
        // 1. Total minted items count (Excluding mock and archived items)
        const totalItemsResult = await db.select({ count: sql<number>`count(*)` })
            .from(mintedItems)
            .where(and(
                not(ilike(mintedItems.id, 'mock-%')),
                eq(mintedItems.isArchived, false)
            ));
        const totalItems = Number(totalItemsResult[0].count);

        // 2. Total money spent (Aggregated to USD)
        // Fetch current exchange rate
        let bsvRate = 45.0; // Fallback
        try {
            const rate = await handcashService.getExchangeRate("USD");
            if (rate) bsvRate = rate;
        } catch (e) {
            console.warn("[Stats API] External rate fetch failed, using fallback");
        }

        const paymentTotals = await db.select({
            currency: payments.currency,
            total: sql<string>`sum(amount)`,
        })
            .from(payments)
            .where(not(ilike(payments.id, 'mock-%')))
            .groupBy(payments.currency);

        const bsvTotal = parseFloat(paymentTotals.find(p => p.currency === 'BSV')?.total || "0");
        const usdTotal = parseFloat(paymentTotals.find(p => p.currency === 'USD')?.total || "0");
        const totalBsvUsd = bsvTotal * bsvRate;
        const totalUsdDirect = usdTotal;
        const totalMoneySpent = totalBsvUsd + totalUsdDirect;

        // 3. Unique minters count (Excluding mock and archived items)
        const uniqueMintersResult = await db.select({ count: sql<number>`count(distinct minted_to_user_id)` })
            .from(mintedItems)
            .where(and(
                not(ilike(mintedItems.id, 'mock-%')),
                eq(mintedItems.isArchived, false)
            ));
        const uniqueMinters = Number(uniqueMintersResult[0].count);

        // 4. Per item stats (most popular items, excluding mock and archived)
        const itemsPerTemplate = await db.select({
            itemName: mintedItems.itemName,
            count: sql<number>`count(*)`,
            imageUrl: mintedItems.imageUrl,
            rarity: mintedItems.rarity
        })
            .from(mintedItems)
            .where(and(
                not(ilike(mintedItems.id, 'mock-%')),
                eq(mintedItems.isArchived, false)
            ))
            .groupBy(mintedItems.itemName, mintedItems.imageUrl, mintedItems.rarity)
            .orderBy(sql`count(*) desc`)
            .limit(6);

        const response = {
            stats: {
                totalItems,
                totalMoneySpent,
                uniqueMinters,
                topItems: itemsPerTemplate
            }
        }
        setCache("stats", response, 300_000)
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("[Stats API] Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
