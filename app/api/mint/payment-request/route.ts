import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { mintIntents, itemTemplates, collections } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "crypto"
import { getTemplates } from "@/lib/item-templates-storage"
import { getCollections } from "@/lib/collections-storage"

export async function POST(request: NextRequest) {
    // Rate Limit
    const rateLimitResponse = rateLimit(request, RateLimitPresets.mint)
    if (rateLimitResponse) {
        return rateLimitResponse
    }

    // 1. Authenticate User
    const authResult = await requireAuth(request)
    if (!authResult.success) {
        return authResult.response
    }
    const { privateKey } = authResult

    try {
        const body = await request.json()
        const { collectionId: requestedCollectionId, pool: requestedPool, quantity, activationTime } = body

        // 2. Get User Profile
        const profile = await handcashService.getUserProfile(privateKey)
        if (!profile || !profile.publicProfile) {
            throw new Error("Could not fetch user profile")
        }
        const userHandle = profile.publicProfile.handle
        const userId = profile.publicProfile.id

        // 3. Determine Mint Details (Item/Collection/Price)
        // Similar logic to standard mint route to determine valid pool/item
        const dbTemplates = await getTemplates() as any[]
        const pool = requestedPool || "mint2"

        // This logic mirrors the main mint route to find items in the pool
        let poolItems = dbTemplates.filter(t => t.pool === pool)
        if (poolItems.length === 0 && pool !== "mint2") {
            poolItems = dbTemplates.filter(t => t.pool === "mint2")
        }

        // Reverted to 0.88 BSV price
        const priceBsv = 0.88;
        const amount = priceBsv * (quantity || 1)

        // Payment Destinations
        const businessHandle = process.env.NEXT_PUBLIC_BUSINESS_HANDLE || process.env.BUSINESS_HANDLE;
        const defaultMintDestinations = businessHandle ? `lexssit:0.6,${businessHandle}:0.4` : ""
        const mintDestinationsRaw = process.env.MINT_DESTINATIONS || defaultMintDestinations

        const receivers: { destination: string, amount: number, currencyCode: string }[] = []

        // Parse destinations and calculate splits
        const destinationsParts = mintDestinationsRaw.split(",").filter(Boolean)
        const destinationWeights: { destination: string, weight: number }[] = []

        for (const part of destinationsParts) {
            const [dest, weightStr] = part.split(":")
            if (dest && weightStr) {
                destinationWeights.push({ destination: dest.trim(), weight: parseFloat(weightStr) })
            } else if (dest) {
                destinationWeights.push({ destination: dest.trim(), weight: 1 })
            }
        }

        const totalWeight = destinationWeights.reduce((sum, d) => sum + d.weight, 0)
        let remainingAmount = amount

        destinationWeights.forEach((dw, index) => {
            const isLast = index === destinationWeights.length - 1
            const splitAmount = isLast ? remainingAmount : parseFloat((amount * (dw.weight / totalWeight)).toFixed(8))
            remainingAmount -= splitAmount

            if (splitAmount > 0) {
                receivers.push({
                    destination: dw.destination,
                    amount: splitAmount,
                    currencyCode: "BSV"
                })
            }
        })

        if (receivers.length === 0) {
            // Fallback if no destinations configured (e.g. mock mode logic or error)
            // For payment request we need at least one receiver. 
            // Failing here if not configured is appropriate for this specific route unless we want a mock PR.
            if (process.env.NODE_ENV !== "production") {
                receivers.push({ destination: "mikesv", amount: amount, currencyCode: "BSV" })
            } else {
                throw new Error("No payment destinations configured")
            }
        }

        // 4. Create Payment Request
        const websiteUrl = process.env.WEBSITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const webhookUrl = `${websiteUrl.replace(/\/$/, "")}/api/webhooks/payment`;

        const paymentRequest = await handcashService.createPaymentRequest({
            productName: "Slavic Survivors Mint",
            productDescription: `Mint ${quantity || 1} item(s) from pool ${pool}`,
            productImageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/ushanka.png", // Generic or specific
            receivers: receivers,
            expirationType: "one_time", // Or 'limit' if tracking supply strictly via HC
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment-complete`,
            webhookUrl: webhookUrl,
            metadata: {
                type: "mint_payment",
                pool: pool,
                quantity: quantity || 1
            }
        })

        // 5. Store Mint Intent
        const mintIntentId = randomUUID()
        await db.insert(mintIntents).values({
            id: mintIntentId,
            paymentRequestId: paymentRequest.id,
            paymentRequestUrl: paymentRequest.paymentRequestUrl,
            userId: userId,
            handle: userHandle,
            collectionId: requestedCollectionId, // Can be null if pool-based
            quantity: quantity || 1,
            amountBsv: amount.toString(),
            status: "pending_payment",
            activationTime: activationTime ? new Date(activationTime) : null,
            // supplyCount: ... // If we were tracking campaign supply here
        })

        return NextResponse.json({
            success: true,
            paymentRequestUrl: paymentRequest.paymentRequestUrl,
            mintIntentId: mintIntentId
        })

    } catch (error: any) {
        console.error("[Mint Payment Request] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create payment request" },
            { status: 500 }
        )
    }
}
