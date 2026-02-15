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
    // 1. Get raw body first as it contains auth info in some HandCash versions
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    console.log("[Webhook] Payment webhook received:", JSON.stringify(body, null, 2))

    // 2. Extract auth info from headers and body
    const appId = request.headers.get("app-id") || request.headers.get("x-app-id")
    const appSecret = request.headers.get("app-secret") || request.headers.get("x-app-secret") || body.appSecret
    const signature = request.headers.get("handcash-signature") || request.headers.get("x-handcash-signature")
    const timestamp = request.headers.get("x-timestamp") || request.headers.get("timestamp")

    console.log("[Webhook] Auth info received:", {
      appId: appId ? "present" : "missing",
      appSecret: appSecret ? "present" : "missing",
      signature: signature ? "present" : "missing",
      timestamp: timestamp ? "present" : "missing",
      userAgent: request.headers.get("user-agent")
    })

    const expectedAppId = process.env.HANDCASH_APP_ID
    const expectedAppSecret = process.env.HANDCASH_APP_SECRET

    // 3. Verify Identity (Warnings only, per request)
    if (expectedAppId && appId && appId !== expectedAppId) {
      console.warn("[Webhook] App ID mismatch (ignoring):", { received: appId, expected: expectedAppId })
    }

    // Verify App Secret if provided
    if (appSecret && expectedAppSecret && appSecret !== expectedAppSecret) {
      console.warn("[Webhook] App Secret mismatch (ignoring)")
    }

    // Verify Signature if present
    if (signature && expectedAppSecret) {
      try {
        const crypto = await import("crypto")
        const hmac = crypto.createHmac("sha256", expectedAppSecret)
        const computedSignature = hmac.update(rawBody).digest("hex")

        if (computedSignature !== signature) {
          console.warn("[Webhook] Invalid signature (ignoring). Computed:", computedSignature, "Received:", signature)
        } else {
          console.log("[Webhook] Signature verified successfully")
        }
      } catch (err) {
        console.error("[Webhook] Signature verification error:", err)
      }
    }

    // Inform about missing auth but proceed
    if (!appSecret && !signature) {
      console.log("[Webhook] Proceeding without app-secret or signature authentication")
    }

    // Validate timestamp (if provided)
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10)
      const timeDiff = Math.abs(Date.now() - requestTime)
      if (timeDiff > 30 * 60 * 1000) { // Increased window to 30 mins
        console.warn("[Webhook] Request timestamp old (ignoring):", timeDiff)
      }
    }

    // 4. Extract payment information
    const paymentRequestId = body.paymentRequestId || body.payment_request_id || body.requestId || body.request_id || body.product?.id
    const transactionId = body.transactionId || body.transaction_id || body.txid || body.id || body.txId
    const amount = body.amount?.amount || body.sendAmount || body.amount || body.fiatAmount
    const currency = body.amount?.currencyCode || body.currencyCode || body.currency || body.fiatCurrency || "BSV"
    const paidBy = body.paidBy || body.paid_by || body.handle || body.userHandle || body.user_handle || body.user?.handle || body.user?.paymail || body.userData?.id
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
    let matchingIntent = await db.query.mintIntents.findFirst({
      where: eq(mintIntents.paymentRequestId, paymentRequestId)
    })

    if (!matchingIntent) {
      console.log(`[Webhook] No intent found for ${paymentRequestId}. Creating synthetic intent...`)
      const syntheticIntentId = randomUUID()
      const userIdFromWebhook = body.userData?.id || paidBy || "unknown"
      const handleFromWebhook = paidBy || body.userData?.id || "unknown"

      try {
        await db.insert(mintIntents).values({
          id: syntheticIntentId,
          paymentRequestId,
          paymentRequestUrl: body.paymentRequestUrl || body.url || "",
          userId: userIdFromWebhook,
          handle: handleFromWebhook,
          quantity: body.quantity || 1,
          amountBsv: (amount || 0).toString(),
          status: "pending_payment", // Will be updated to 'paid' immediately below
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Refresh matchingIntent with the newly created one
        matchingIntent = await db.query.mintIntents.findFirst({
          where: eq(mintIntents.id, syntheticIntentId)
        })
        console.log(`[Webhook] Synthetic intent created: ${syntheticIntentId}`)
      } catch (err) {
        console.error("[Webhook] Failed to create synthetic intent:", err)
      }
    }

    if (matchingIntent) {
      console.log(`[Webhook] Processing intent: ${matchingIntent.id} (Status: ${matchingIntent.status})`)

      // Update intent status to 'paid' if it was pending
      if (matchingIntent.status === "pending_payment") {
        await db.update(mintIntents)
          .set({
            status: "paid",
            transactionId: transactionId,
            paidAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(mintIntents.id, matchingIntent.id))

        // Update local ref to match state
        matchingIntent.status = "paid"
      }

      // Check Activation Time for fulfillment
      const now = new Date()
      const activationTime = matchingIntent.activationTime

      if (!activationTime || activationTime <= now) {
        // Immediate Fulfillment
        console.log(`[Webhook] Activating mint intent ${matchingIntent.id} immediately.`)

        try {
          // 1. Determine Pool and Items
          const dbTemplates = await getTemplates() as any[]
          // Use the collectionId (which often stores the pool name) or default to mint2
          const pool = matchingIntent.collectionId || "mint2"

          let poolItems = dbTemplates.filter(t => t.pool === pool)
          if (poolItems.length === 0) {
            console.log(`[Webhook] Pool '${pool}' not found, falling back to 'mint2'`)
            poolItems = dbTemplates.filter(t => t.pool === "mint2")
          }

          if (poolItems.length > 0) {
            // 2. Resolve Destination (The actual Payer)
            const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN

            // Prioritize the actual payer info from HandCash
            let destinationUserId = body.userData?.id
            const payerHandle = body.userData?.handle || (typeof paidBy === 'string' ? paidBy : null)

            if (!destinationUserId && payerHandle) {
              console.log(`[Webhook] Resolving payer handle: ${payerHandle}`)
              const handleMap = await resolveHandlesToUserIds([payerHandle], businessAuthToken!)
              destinationUserId = handleMap[payerHandle.toLowerCase()]
            }

            // Fallback to intent userId if still unknown
            if (!destinationUserId || destinationUserId === "unknown") {
              console.log(`[Webhook] Could not resolve actual payer, falling back to intent creator: ${matchingIntent.userId}`)
              destinationUserId = matchingIntent.userId
            }

            if (destinationUserId && destinationUserId !== "unknown") {
              const minter = getMinter()
              const quantity = matchingIntent.quantity || 1
              const itemsToCreate = []

              // 3. Prepare Items (Randomly select for each quantity unit)
              for (let i = 0; i < quantity; i++) {
                const randomIndex = Math.floor(Math.random() * poolItems.length)
                const randomItem = poolItems[randomIndex]

                const mediaDetails: any = {
                  image: { url: (randomItem as any).imageUrl, contentType: "image/png" }
                }
                if ((randomItem as any).multimediaUrl) {
                  mediaDetails.multimedia = { url: (randomItem as any).multimediaUrl, contentType: "application/glb" }
                }

                itemsToCreate.push({
                  user: destinationUserId,
                  name: randomItem.name,
                  rarity: (randomItem as any).rarity,
                  mediaDetails,
                  attributes: (randomItem as any).attributes || [],
                  description: (randomItem as any).description || "",
                  quantity: 1,
                  actions: [],
                  // Store local template ID for persistence later
                  _localTemplateId: (randomItem as any).id
                })
              }

              // 4. Execute Minting
              const collectionIdForMint = matchingIntent.collectionId && /^[0-9a-fA-F]{24}$/.test(matchingIntent.collectionId)
                ? matchingIntent.collectionId
                : process.env.NEXT_PUBLIC_COLLECTION_ID

              if (collectionIdForMint) {
                const creationOrder = await minter.createItemsOrder({
                  collectionId: collectionIdForMint,
                  items: itemsToCreate.map(({ _localTemplateId, ...item }) => item)
                })

                const items = await minter.getOrderItems(creationOrder.id)

                // 5. Persist Minted Items
                if (items && items.length > 0) {
                  for (let i = 0; i < items.length; i++) {
                    const mintedItem = items[i]
                    const localTemplateId = itemsToCreate[i]._localTemplateId

                    await db.insert(mintedItems).values({
                      id: mintedItem.id,
                      origin: mintedItem.origin,
                      collectionId: collectionIdForMint,
                      templateId: localTemplateId,
                      mintedToUserId: destinationUserId,
                      mintedToHandle: payerHandle || matchingIntent.handle,
                      itemName: mintedItem.name,
                      rarity: mintedItem.rarity,
                      imageUrl: itemsToCreate[i].mediaDetails.image.url,
                      paymentId: payment.id,
                      metadata: { source: "webhook_fulfillment", index: i }
                    })
                  }

                  await db.update(mintIntents)
                    .set({ status: "activated", updatedAt: new Date() })
                    .where(eq(mintIntents.id, matchingIntent.id))

                  console.log(`[Webhook] Mint intent ${matchingIntent.id} fulfilled. ${items.length} items minted to ${destinationUserId}`)
                }
              } else {
                console.error("[Webhook] No valid collection ID found for minting")
              }
            } else {
              console.warn(`[Webhook] Could not determine destination user ID for intent ${matchingIntent.id}`)
            }
          } else {
            console.error(`[Webhook] No items found in pool for intent ${matchingIntent.id}`)
          }
        } catch (err) {
          console.error(`[Webhook] Failed to fulfill mint intent ${matchingIntent.id}:`, err)
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

