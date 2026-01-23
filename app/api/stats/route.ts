import { db } from "@/lib/db"
import { mintedItems, payments } from "@/lib/schema"
import { NextResponse } from "next/server"
import { sql, and, not, ilike, eq } from "drizzle-orm"
import { handcashService } from "@/lib/handcash-service"

export async function GET() {
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

        const bsvPayments = await db.select({ total: sql<string>`sum(amount)` })
            .from(payments)
            .where(and(
                eq(payments.currency, 'BSV'),
                not(ilike(payments.id, 'mock-%'))
            ));

        const usdPayments = await db.select({ total: sql<string>`sum(amount)` })
            .from(payments)
            .where(and(
                eq(payments.currency, 'USD'),
                not(ilike(payments.id, 'mock-%'))
            ));

        const totalBsvUsd = parseFloat(bsvPayments[0].total || "0") * bsvRate;
        const totalUsdDirect = parseFloat(usdPayments[0].total || "0");
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

        return NextResponse.json({
            stats: {
                totalItems,
                totalMoneySpent,
                uniqueMinters,
                topItems: itemsPerTemplate
            }
        });
    } catch (error: any) {
        console.error("[Stats API] Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
