// HandCash webhook endpoint for payment notifications
import { type NextRequest, NextResponse } from "next/server"
import { savePayment } from "@/lib/payments-storage"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { mintIntents, mintedItems } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getMinter, resolveHandlesToUserIds } from "@/lib/items-client"
import { getTemplates } from "@/lib/item-templates-storage"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  // Apply rate limiting (webhooks should not be called frequently)
  const rateLimitResponse = rateLimit(request, { limit: 100, windowMs: 60 * 1000 }) // 100 per minute
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Verify webhook authenticity (HandCash sends app-id and app-secret headers)
    const appId = request.headers.get("app-id")
    const appSecret = request.headers.get("app-secret")
    const timestamp = request.headers.get("x-timestamp") // If HandCash provides timestamp
    const expectedAppId = process.env.HANDCASH_APP_ID
    const expectedAppSecret = process.env.HANDCASH_APP_SECRET

    // Validate required headers are present
    if (!appId || !appSecret) {
      console.warn("[Webhook] Missing authentication headers")
      return NextResponse.json({ error: "Missing authentication headers" }, { status: 401 })
    }

    // Basic verification - in production, you might want to verify signatures
    if (expectedAppId && appId !== expectedAppId) {
      console.warn("[Webhook] Invalid app-id header")
      return NextResponse.json({ error: "Invalid app-id" }, { status: 401 })
    }

    if (expectedAppSecret && appSecret !== expectedAppSecret) {
      console.warn("[Webhook] Invalid app-secret header")
      return NextResponse.json({ error: "Invalid app-secret" }, { status: 401 })
    }

    // Validate timestamp to prevent replay attacks (if provided)
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10)
      const currentTime = Date.now()
      const timeDiff = Math.abs(currentTime - requestTime)
      // Reject requests older than 5 minutes (300000ms)
      if (timeDiff > 5 * 60 * 1000) {
        console.warn("[Webhook] Request timestamp too old:", timeDiff)
        return NextResponse.json({ error: "Request timestamp expired" }, { status: 401 })
      }
    }

    const body = await request.json()
    console.log("[Webhook] Payment webhook received:", JSON.stringify(body, null, 2))

    // Extract payment information from webhook payload
    // HandCash webhook structure may vary - adjust based on actual payload
    const paymentRequestId = body.paymentRequestId || body.payment_request_id || body.requestId || body.request_id
    const transactionId = body.transactionId || body.transaction_id || body.txid || body.id
    const amount = body.amount?.amount || body.sendAmount || body.amount
    const currency = body.amount?.currencyCode || body.currencyCode || body.currency || "BSV"
    const paidBy = body.paidBy || body.paid_by || body.handle || body.userHandle || body.user_handle
    const status = body.status || "completed"
    const paidAt = body.paidAt || body.paid_at || body.timestamp || body.createdAt || new Date().toISOString()

    if (!paymentRequestId || !transactionId) {
      console.error("[Webhook] Missing required fields:", { paymentRequestId, transactionId })
      return NextResponse.json({ error: "Missing paymentRequestId or transactionId" }, { status: 400 })
    }

    // Create payment record
    const payment = {
      id: `${paymentRequestId}-${transactionId}`,
      paymentRequestId,
      transactionId,
      amount: typeof amount === "string" ? parseFloat(amount) : amount || 0,
      currency,
      paidBy,
      paidAt: typeof paidAt === "string" ? paidAt : new Date(paidAt).toISOString(),
      status: status.toLowerCase() as "completed" | "failed" | "cancelled",
      metadata: body, // Store full payload for reference
    }

    await savePayment(payment)
    console.log("[Webhook] Payment saved:", payment.id)

    // Check for associated Mint Intent
    const matchingIntent = await db.query.mintIntents.findFirst({
      where: eq(mintIntents.paymentRequestId, paymentRequestId)
    })

    if (matchingIntent && matchingIntent.status === "pending_payment") {
      console.log(`[Webhook] Found matching mint intent ${matchingIntent.id} for payment request ${paymentRequestId}`)

      // Update intent status to 'paid'
      await db.update(mintIntents)
        .set({
          status: "paid",
          transactionId: transactionId,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(mintIntents.id, matchingIntent.id))

      // Check Activation Time
      const now = new Date()
      const activationTime = matchingIntent.activationTime

      if (!activationTime || activationTime <= now) {
        // Immediate Fulfillment
        console.log(`[Webhook] Activating mint intent ${matchingIntent.id} immediately.`)

        try {
          // 1. Select Item to Mint (similar logic to main mint route)
          // We need to pick an item from the pool or specific template
          // Ideally the intent has stored enough info or we re-run generic selection logic

          const dbTemplates = await getTemplates() as any[]
          // Determine pool/collection from intent or fallback
          // matchingIntent does not have pool column, maybe stored in dbTemplates logic or we assume default
          const pool = "mint2" // or derive from intent if added
          // Simplify: just pick random item from mint2 pool for now as per user standard flow

          let poolItems = dbTemplates.filter(t => t.pool === pool)
          if (poolItems.length === 0) {
            // Fallback check
            poolItems = dbTemplates.filter(t => t.pool === "mint2")
          }

          if (poolItems.length > 0) {
            // Weighted random selection
            const getItemWeight = (item: any) => {
              return 100 // Simplify weight for webhook context or implement full logic
            };
            const randomIndex = Math.floor(Math.random() * poolItems.length)
            const randomItem = poolItems[randomIndex]

            // 2. Mint Item
            const minter = getMinter()
            const handleMap = await resolveHandlesToUserIds([matchingIntent.handle], process.env.BUSINESS_AUTH_TOKEN!)
            const destinationUserId = handleMap[matchingIntent.handle.toLowerCase()]

            if (destinationUserId) {
              const itemToMint: any = {
                user: destinationUserId,
                quantity: matchingIntent.quantity || 1,
                name: randomItem.name,
                rarity: (randomItem as any).rarity,
                mediaDetails: {
                  image: { url: (randomItem as any).imageUrl, contentType: "image/png" }
                },
                attributes: (randomItem as any).attributes || [],
                templateId: (randomItem as any).id
              }

              // Mint
              const collectionId = (randomItem as any).collectionId || process.env.NEXT_PUBLIC_COLLECTION_ID
              if (collectionId) {
                const creationOrder = await minter.createItemsOrder({
                  collectionId: collectionId,
                  items: [itemToMint]
                })

                const items = await minter.getOrderItems(creationOrder.id)
                if (items && items.length > 0) {
                  const mintedItem = items[0]

                  // Record Minted Item
                  await db.insert(mintedItems).values({
                    id: mintedItem.id,
                    origin: mintedItem.origin,
                    collectionId: collectionId,
                    templateId: (randomItem as any).id,
                    mintedToUserId: destinationUserId,
                    mintedToHandle: matchingIntent.handle,
                    itemName: mintedItem.name,
                    rarity: mintedItem.rarity,
                    imageUrl: (randomItem as any).imageUrl,
                    paymentId: payment.id,
                    metadata: { source: "payment_request" }
                  })

                  // Update Intent to 'activated'
                  await db.update(mintIntents)
                    .set({ status: "activated", updatedAt: new Date() })
                    .where(eq(mintIntents.id, matchingIntent.id))

                  console.log(`[Webhook] Mint intent ${matchingIntent.id} activated and item minted: ${mintedItem.id}`)
                }
              }
            }
          }
        } catch (err) {
          console.error(`[Webhook] Failed to fulfill mint intent ${matchingIntent.id}:`, err)
          // Optionally update status to 'failed' or 'retry_needed'
        }
      } else {
        console.log(`[Webhook] Mint intent ${matchingIntent.id} is scheduled for activation at ${activationTime.toISOString()}`)
      }
    }

    return NextResponse.json({ success: true, paymentId: payment.id })
  } catch (error: any) {
    console.error("[Webhook] Payment webhook error:", error)
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "payment-webhook" })
}

