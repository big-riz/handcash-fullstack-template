import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { getMinter, resolveHandlesToUserIds } from "@/lib/items-client"
import { getCollections } from "@/lib/collections-storage"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { recordMintedItem } from "@/lib/minted-items-storage"
import { getTemplates } from "@/lib/item-templates-storage"
import { savePayment } from "@/lib/payments-storage"
import { db } from "@/lib/db"
import { mintedItems as mintedItemsTable } from "@/lib/schema"
import { sql } from "drizzle-orm"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
    // Rate Limit: Using standard mint preset (allows more requests for testing/usage)
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
        // 2. Get User Profile to resolve handle
        const profile = await handcashService.getUserProfile(privateKey)
        if (!profile || !profile.publicProfile) {
            throw new Error("Could not fetch user profile")
        }
        const userHandle = profile.publicProfile.handle
        const userId = profile.publicProfile.id

        if (!userHandle) {
            throw new Error("Could not fetch user handle")
        }

        // 3. Get Templates from DB
        const dbTemplates = await getTemplates() as any[]

        // Hardcoded fallbacks if DB is empty
        const fallbackItemTypes = [
            { name: "Adidas Tracksuit", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tracksuit_blue.png", pool: "default", supplyLimit: 1000 },
            { name: "Sunflower Seeds", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/seeds.png", pool: "default", supplyLimit: 500 },
            { name: "KV-2 Tank Model", rarity: "Rare", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tank.png", multimediaUrl: "https://res.cloudinary.com/handcash-io/raw/upload/v1710255990/items/kv2.glb", pool: "default", supplyLimit: 50 },
            { name: "Gold Chain", rarity: "Epic", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/gold_chain.png", pool: "default", supplyLimit: 10 },
            { name: "Golden Ushanka", rarity: "Legendary", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/ushanka.png", pool: "default", supplyLimit: 1 }
        ]

        // 3a. Pool Selection Logic
        const allTemplates = dbTemplates.length > 0 ? dbTemplates : fallbackItemTypes;

        // Try to get pool from body or query params
        let requestedPool = "default";
        try {
            const body = await request.clone().json();
            requestedPool = body.pool || "default";
        } catch (e) {
            const { searchParams } = new URL(request.url);
            requestedPool = searchParams.get("pool") || "default";
        }

        let poolItems = allTemplates.filter(t => t.pool === requestedPool);

        // Fallback if pool is empty
        if (poolItems.length === 0) {
            console.log(`[Mint API] Pool '${requestedPool}' not found or empty, falling back to 'default'`);
            poolItems = allTemplates.filter(t => t.pool === "default");
        }
        if (poolItems.length === 0) {
            poolItems = allTemplates;
        }

        // Fetch current mint counts from DB to check supply limits
        const mintCounts = await db
            .select({
                templateId: mintedItemsTable.templateId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(mintedItemsTable)
            .groupBy(mintedItemsTable.templateId);

        const mintCountMap = new Map(mintCounts.map(mc => [mc.templateId, mc.count]));

        // Filter items that reached their supply limit
        let availableItems = poolItems.filter(item => {
            if (!item.id) return true; // Fallback items don't have IDs usually or aren't tracked firmly
            const minted = mintCountMap.get(item.id) || 0;
            return item.supplyLimit === 0 || minted < item.supplyLimit;
        });

        if (availableItems.length === 0) {
            return NextResponse.json({ error: "Pool is sold out!" }, { status: 400 });
        }

        // Weighted random selection using supplyLimit as weight
        // For unlimited items (supplyLimit: 0), we assign a default weight (e.g. 100)
        const getItemWeight = (item: any) => item.supplyLimit > 0 ? item.supplyLimit : 100;

        const totalWeight = availableItems.reduce((acc, item) => acc + getItemWeight(item), 0);
        let randomNum = Math.random() * totalWeight;
        let randomItem = availableItems[0];

        for (const item of availableItems) {
            randomNum -= getItemWeight(item);
            if (randomNum <= 0) {
                randomItem = item;
                break;
            }
        }

        console.log(`[Mint API] Selected ${randomItem.name} from pool '${randomItem.pool || 'default'}' (Supply: ${randomItem.supplyLimit || 'Unlimited'}, Weighted Score: ${getItemWeight(randomItem)}/${totalWeight})`)

        // 4. Determine if we can do real minting
        const collections = await getCollections()
        const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN
        const businessHandle = process.env.NEXT_PUBLIC_BUSINESS_HANDLE || process.env.BUSINESS_HANDLE;

        // We use mock mode if:
        // - No collection ID is available (and we can't find one in DB)
        // - Business Auth Token is missing
        // - Specific flag is set (optional, but for now we try to be real)
        const collectionId = (randomItem as any).collectionId || (collections.length > 0 ? collections[0].id : null);

        const isMockMode = !businessAuthToken || !collectionId || !businessHandle;

        let paymentId: string | undefined;

        if (!isMockMode) {
            console.log(`[Mint API] Real Mode: Minting ${randomItem.name} to ${userHandle} using collection ${collectionId}`)

            // 5. Process Payment (User -> Business)
            const rateData = await handcashService.getExchangeRate("USD")
            const rate = typeof rateData === "number" ? rateData : ((rateData as any)?.rate || (rateData as any)?.exchangeRate);

            if (!rate || typeof rate !== "number") {
                console.error("[Mint API] Invalid rate data:", rateData)
                throw new Error("Could not fetch valid exchange rate")
            }

            const priceUsd = 0.05;
            const bsvAmount = priceUsd / rate;
            const roundedBsvAmount = Math.ceil(bsvAmount * 100000000) / 100000000;

            console.log(`[Mint API] Processing payment of ${roundedBsvAmount} BSV to ${businessHandle}`)

            // HandCash has a 25-character limit on the note field
            // Format: "Mint: {ItemName}" with truncation if needed
            const maxNoteLength = 25;
            const prefix = "Mint: ";
            const maxItemNameLength = maxNoteLength - prefix.length;
            const truncatedName = randomItem.name.length > maxItemNameLength
                ? randomItem.name.substring(0, maxItemNameLength - 1) + "…"
                : randomItem.name;
            const paymentNote = `${prefix}${truncatedName}`;

            const paymentResponse = await handcashService.sendPayment(privateKey, {
                destination: businessHandle!,
                amount: roundedBsvAmount,
                currency: "BSV",
                description: paymentNote
            }) as any

            // Log Payment to DB
            paymentId = randomUUID();
            await savePayment({
                id: paymentId,
                paymentRequestId: `mint-${randomItem.id || 'random'}-${Date.now()}`,
                transactionId: paymentResponse.transactionId,
                amount: roundedBsvAmount,
                currency: "BSV",
                paidBy: userHandle,
                paidAt: new Date().toISOString(),
                status: "completed",
                metadata: {
                    type: "mint_payment",
                    templateId: randomItem.id,
                    pool: randomItem.pool
                }
            })

            // 6. Mint Item (Business -> User)
            const handleMap = await resolveHandlesToUserIds([userHandle], businessAuthToken!)
            const destinationUserId = handleMap[userHandle.toLowerCase()]

            if (!destinationUserId) throw new Error("Could not resolve user ID for minting")

            const minter = getMinter()

            // Build mediaDetails based on what's available
            const mediaDetails: any = {}
            if ((randomItem as any).multimediaUrl) {
                mediaDetails.multimedia = {
                    url: (randomItem as any).multimediaUrl,
                    contentType: "application/glb",
                }
            }
            if ((randomItem as any).imageUrl || (randomItem as any).image) {
                mediaDetails.image = {
                    url: (randomItem as any).imageUrl || (randomItem as any).image,
                    contentType: "image/png",
                }
            }

            // Construct the item definition for minting (always include metadata to avoid validation errors)
            const itemToMint: any = {
                user: destinationUserId,
                quantity: 1,
                name: randomItem.name,
                rarity: (randomItem as any).rarity,
                mediaDetails,
                attributes: (randomItem as any).attributes || [
                    { name: "Type", value: "Gear", displayType: "string" },
                    { name: "Rarity", value: (randomItem as any).rarity, displayType: "string" }
                ],
                actions: []
            }

            // Store the template ID for our database (regardless of format)
            const sourceTemplateId = (randomItem as any).id;

            // Only use templateId for HandCash if it looks like a valid HandCash ID (24-char hex)
            // Local debug templates often use UUIDs which would cause HandCash to error
            if (sourceTemplateId && /^[0-9a-fA-F]{24}$/.test(sourceTemplateId)) {
                itemToMint.templateId = sourceTemplateId;
            }

            const creationOrder = await minter.createItemsOrder({
                collectionId: collectionId!,
                items: [itemToMint]
            })

            const items = await minter.getOrderItems(creationOrder.id)

            if (items && items.length > 0) {
                const mintedItem = items[0] as any;

                // Record in DB - use sourceTemplateId for our database tracking
                await recordMintedItem({
                    id: mintedItem.id,
                    origin: mintedItem.origin,
                    collectionId: collectionId!,
                    templateId: sourceTemplateId, // ← Use the original template ID here
                    mintedToUserId: userId,
                    mintedToHandle: userHandle,
                    itemName: mintedItem.name,
                    rarity: mintedItem.rarity,
                    imageUrl: mintedItem.mediaDetails?.image?.url || (randomItem as any).imageUrl || (randomItem as any).image,
                    multimediaUrl: mintedItem.mediaDetails?.multimedia?.url || (randomItem as any).multimediaUrl,
                    paymentId: paymentId,
                    metadata: {
                        mintedAt: new Date().toISOString(),
                    }
                })

                return NextResponse.json({
                    success: true,
                    item: {
                        id: mintedItem.id,
                        origin: mintedItem.origin,
                        name: mintedItem.name,
                        imageUrl: mintedItem.mediaDetails?.image?.url || (randomItem as any).imageUrl || (randomItem as any).image,
                        multimediaUrl: (randomItem as any).multimediaUrl,
                        rarity: mintedItem.rarity
                    }
                })
            } else {
                throw new Error("Minting succeeded but no items were returned in the order")
            }
        } else {
            console.warn("[Mint API] MOCK MODE: Missing config. Business Token:", !!businessAuthToken, "Collection:", !!collectionId, "Business Handle:", !!businessHandle)

            // Mock Mode Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mintedItemId = `mock-${Date.now()}`;
            const mintedItemOrigin = `mock-origin-${Date.now()}`;
            const imageUrl = (randomItem as any).imageUrl || (randomItem as any).image;

            // Log Mock Payment to DB
            paymentId = randomUUID();
            const mockPriceUsd = 0.05;
            await savePayment({
                id: paymentId,
                paymentRequestId: `mock-mint-${randomItem.id || 'random'}-${Date.now()}`,
                transactionId: `mock-tx-${Date.now()}`,
                amount: mockPriceUsd,
                currency: "USD",
                paidBy: userHandle,
                paidAt: new Date().toISOString(),
                status: "completed",
                metadata: {
                    type: "mint_payment_mock",
                    templateId: randomItem.id,
                    pool: randomItem.pool
                }
            })

            await recordMintedItem({
                id: mintedItemId,
                origin: mintedItemOrigin,
                collectionId: collectionId || undefined,
                templateId: (randomItem as any).id,
                mintedToUserId: userId,
                mintedToHandle: userHandle,
                itemName: randomItem.name,
                rarity: (randomItem as any).rarity,
                imageUrl: imageUrl,
                multimediaUrl: (randomItem as any).multimediaUrl,
                paymentId: paymentId,
                metadata: {
                    mockMode: true,
                    mintedAt: new Date().toISOString(),
                }
            })

            return NextResponse.json({
                success: true,
                item: {
                    id: mintedItemId,
                    origin: mintedItemOrigin,
                    name: randomItem.name,
                    imageUrl: imageUrl,
                    multimediaUrl: (randomItem as any).multimediaUrl,
                    rarity: (randomItem as any).rarity
                }
            })
        }

    } catch (error: any) {
        console.error("[Mint API] Error:", error)
        return NextResponse.json(
            { error: error.message || "Minting failed" },
            { status: 500 }
        )
    }
}
