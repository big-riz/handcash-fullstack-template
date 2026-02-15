
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mintIntents, mintedItems, itemTemplates } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const intentId = searchParams.get("intentId")
    const paymentRequestId = searchParams.get("paymentRequestId")

    if (!intentId && !paymentRequestId) {
        return NextResponse.json({ error: "Missing intentId or paymentRequestId" }, { status: 400 })
    }

    try {
        const intent = await db.query.mintIntents.findFirst({
            where: intentId
                ? eq(mintIntents.id, intentId)
                : eq(mintIntents.paymentRequestId, paymentRequestId as string)
        })

        if (!intent) {
            return NextResponse.json({ error: "Intent not found" }, { status: 404 })
        }

        let mintedItemDetails = null;
        if (intent.status === "activated" || intent.status === "completed") {
            const paymentId = `${intent.paymentRequestId}-${intent.transactionId}`;
            const mintedItem = await db.query.mintedItems.findFirst({
                where: eq(mintedItems.paymentId, paymentId)
            });

            if (mintedItem && mintedItem.templateId) {
                const template = await db.query.itemTemplates.findFirst({
                    where: eq(itemTemplates.id, mintedItem.templateId as string)
                });
                mintedItemDetails = {
                    ...mintedItem,
                    multimediaUrl: template?.multimediaUrl
                };
            }
        }

        return NextResponse.json({
            success: true,
            status: intent.status,
            intentId: intent.id,
            paidAt: intent.paidAt,
            activationTime: intent.activationTime,
            item: mintedItemDetails
        })

    } catch (error: any) {
        console.error("[Mint Status] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to check status" },
            { status: 500 }
        )
    }
}
