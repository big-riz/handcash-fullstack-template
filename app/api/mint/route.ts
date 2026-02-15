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
import { mintedItems as mintedItemsTable, mintIntents } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "crypto"

type MintPaymentDestination = {
    destination: string
    weight: number
}

const parseMintDestinations = (raw: string | undefined): MintPaymentDestination[] => {
    const entries = (raw || "")
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean)

    const destinations: MintPaymentDestination[] = []
    for (const entry of entries) {
        const [destinationRaw, weightRaw] = entry.split(":")
        const destination = destinationRaw?.trim()
        if (!destination) continue

        const parsedWeight = weightRaw ? Number(weightRaw.trim()) : 1
        const weight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1

        destinations.push({ destination, weight })
    }

    return destinations
}

const buildMintSplits = (totalBsv: number, destinations: MintPaymentDestination[]) => {
    if (!destinations.length) return []

    const totalSats = Math.round(totalBsv * 100000000)
    const totalWeight = destinations.reduce((acc, dest) => acc + dest.weight, 0)
    if (totalSats <= 0 || totalWeight <= 0) return []

    let remainingSats = totalSats
    return destinations.map((dest, index) => {
        const isLast = index === destinations.length - 1
        const sats = isLast
            ? remainingSats
            : Math.floor((totalSats * dest.weight) / totalWeight)

        remainingSats -= sats

        return {
            destination: dest.destination,
            amountBsv: sats / 100000000,
            amountSats: sats,
        }
    })
}

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
            { name: "Adidas Tracksuit", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tracksuit_blue.png", pool: "mint2", supplyLimit: 1000 },
            { name: "Sunflower Seeds", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/seeds.png", pool: "mint2", supplyLimit: 500 },
            { name: "KV-2 Tank Model", rarity: "Rare", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tank.png", multimediaUrl: "https://res.cloudinary.com/handcash-io/raw/upload/v1710255990/items/kv2.glb", pool: "mint2", supplyLimit: 50 },
            { name: "Gold Chain", rarity: "Epic", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/gold_chain.png", pool: "mint2", supplyLimit: 10 },
            { name: "Golden Ushanka", rarity: "Legendary", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/ushanka.png", pool: "mint2", supplyLimit: 1 }
        ]

        // 3a. Pool Selection Logic
        const allTemplates = dbTemplates.length > 0 ? dbTemplates : fallbackItemTypes;

        // Try to get pool from body or query params
        let requestedPool = "mint2";
        let requestedCollectionId: string | null = null;
        let requestBody: any = null;
        try {
            requestBody = await request.clone().json();
            if (typeof requestBody.pool === "string" && requestBody.pool.trim()) {
                requestedPool = requestBody.pool.trim();
            }
            if (typeof requestBody.collectionId === "string" && requestBody.collectionId.trim()) {
                requestedCollectionId = requestBody.collectionId.trim();
            }
        } catch (e) {
            const { searchParams } = new URL(request.url);
            requestedPool = searchParams.get("pool") || "mint2";
        }
        const allowDebugDetails = process.env.NODE_ENV !== "production";
        const includeSplitDetails = allowDebugDetails && (requestBody?.includeSplits === true || requestBody?.debug === true);

        let poolItems = allTemplates.filter(t => t.pool === requestedPool);

        // Fallback if pool is empty
        if (poolItems.length === 0) {
            console.log(`[Mint API] Pool '${requestedPool}' not found or empty, falling back to 'mint2'`);
            poolItems = allTemplates.filter(t => t.pool === "mint2");
        }
        if (poolItems.length === 0) {
            poolItems = allTemplates;
        }

        // Fetch current mint counts from DB to check supply limits (excluding archived)
        const mintCounts = await db
            .select({
                templateId: mintedItemsTable.templateId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(mintedItemsTable)
            .where(eq(mintedItemsTable.isArchived, false))
            .groupBy(mintedItemsTable.templateId);

        const mintCountMap = new Map(
            mintCounts
                .filter(mc => mc.templateId)
                .map(mc => [mc.templateId as string, mc.count])
        );

        // Filter items that reached their supply limit
        const availableItems = poolItems.filter(item => {
            if (!item.id) return true; // Fallback items don't have IDs usually or aren't tracked firmly
            const minted = mintCountMap.get(item.id) || 0;
            return item.supplyLimit === 0 || minted < item.supplyLimit;
        });

        if (availableItems.length === 0) {
            return NextResponse.json({ error: "Pool is sold out!" }, { status: 400 });
        }

        // Weighted random selection using remaining supply as weight
        // For unlimited items (supplyLimit: 0), we assign a default weight (e.g. 100)
        const getItemWeight = (item: any) => {
            if (item.supplyLimit === 0) return 100;
            const minted = item.id ? (mintCountMap.get(item.id) || 0) : 0;
            return Math.max(1, item.supplyLimit - minted);
        };

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
        const defaultMintDestinations = businessHandle ? `lexssit:0.6,${businessHandle}:0.4` : ""
        const mintDestinations = parseMintDestinations(process.env.MINT_DESTINATIONS || defaultMintDestinations)
        const hasPaymentDestinations = mintDestinations.length > 0

        // We use mock mode if:
        // - No collection ID is available (and we can't find one in DB)
        // - Business Auth Token is missing
        // - Specific flag is set (optional, but for now we try to be real)
        const allowCollectionOverride = process.env.NODE_ENV !== "production";
        let collectionIdOverride = allowCollectionOverride ? requestedCollectionId : null;

        if (collectionIdOverride && !/^[0-9a-fA-F]{24}$/.test(collectionIdOverride)) {
            console.warn(`[Mint API] Requested Collection ID "${collectionIdOverride}" is invalid (must be 24-char hex). Ignoring.`);
            collectionIdOverride = null;
        }

        if (requestedCollectionId && !allowCollectionOverride) {
            console.warn("[Mint API] Collection override ignored outside development.");
        }

        // Prioritize: 1. Override, 2. Item specifc, 3. First available DB collection
        let collectionId = collectionIdOverride;
        if (!collectionId) {
            const itemCollectionId = (randomItem as any).collectionId;
            if (itemCollectionId && /^[0-9a-fA-F]{24}$/.test(itemCollectionId)) {
                collectionId = itemCollectionId;
            }
        }
        if (!collectionId && collections.length > 0) {
            collectionId = collections[0].id;
        }

        const isMockMode = !businessAuthToken || !collectionId || !hasPaymentDestinations;

        const paymentIds: string[] = [];

        if (!isMockMode) {
            console.log(`[Mint API] Real Mode: Minting ${randomItem.name} to ${userHandle} using collection ${collectionId}`)

            // 5. Process Payment (User -> Business)
            const mintPriceBsv = 0.88;
            const paymentSplits = buildMintSplits(mintPriceBsv, mintDestinations);

            console.log(`[Mint API] Processing payment of ${mintPriceBsv} BSV split across ${paymentSplits.length} destination(s)`)

            // HandCash has a 25-character limit on the note field
            const paymentNote = "Slavic Survivors Mint";
            const paymentRequestBase = `mint-${randomItem.id || 'random'}-${Date.now()}`

            // 5a. Check User Balance
            const balance = await handcashService.getBalance(privateKey);
            const balanceItems = (balance.spendableBalances as any).items || [];
            const spendableBsv = balanceItems.find((b: any) => b.currencyCode === 'BSV')?.spendableBalance || 0;

            if (spendableBsv < mintPriceBsv) {
                throw new Error(`Insufficient funds: ${spendableBsv.toFixed(4)} BSV available, ${mintPriceBsv} BSV required. Please top up your wallet or increase your spending limit if you believe this is a mistake.`);
            }

            try {
                for (let i = 0; i < paymentSplits.length; i++) {
                    const split = paymentSplits[i]
                    if (split.amountBsv <= 0) continue

                    const paymentResponse = await handcashService.sendPayment(privateKey, {
                        destination: split.destination,
                        amount: split.amountBsv,
                        currency: "BSV",
                        description: paymentNote
                    }) as any

                    const paymentId = randomUUID();
                    paymentIds.push(paymentId)

                    // Log Payment to DB
                    await savePayment({
                        id: paymentId,
                        paymentRequestId: `${paymentRequestBase}-${i + 1}`,
                        transactionId: paymentResponse.transactionId,
                        amount: split.amountBsv,
                        currency: "BSV",
                        paidBy: userHandle,
                        paidAt: new Date().toISOString(),
                        status: "completed",
                        metadata: {
                            type: "mint_payment",
                            templateId: randomItem.id,
                            pool: randomItem.pool,
                            destination: split.destination,
                            splitIndex: i + 1,
                            splitCount: paymentSplits.length,
                            paymentRequestBase
                        }
                    })
                }
            } catch (paymentError: any) {
                console.warn("[Mint API] Direct payment failed, attempting fallback to Payment Request:", paymentError.message);

                // Fallback: Create Payment Request
                try {
                    const receivers = paymentSplits.map(split => ({
                        destination: split.destination,
                        amount: split.amountBsv,
                        currencyCode: "BSV"
                    }));

                    const paymentRequest = await handcashService.createPaymentRequest({
                        productName: "Slavic Survivors Mint",
                        productDescription: `Minting ${randomItem.name}`,
                        productImageUrl: (randomItem as any).imageUrl || "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tracksuit_blue.png",
                        receivers: receivers,
                        expirationType: "expiration",
                        expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
                        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/mint-complete`, // Or handled by popup
                        metadata: {
                            action: "mint",
                            templateId: randomItem.id,
                            pool: randomItem.pool,
                            userHandle: userHandle
                        }
                    });

                    const mintIntentId = randomUUID();
                    await db.insert(mintIntents).values({
                        id: mintIntentId,
                        paymentRequestId: paymentRequest.id,
                        paymentRequestUrl: paymentRequest.paymentRequestUrl,
                        userId: userId,
                        handle: userHandle,
                        collectionId: collectionId,
                        templateId: (randomItem as any).id,
                        quantity: 1,
                        amountBsv: mintPriceBsv.toString(),
                        status: "pending_payment"
                    });

                    return NextResponse.json({
                        success: false,
                        needPaymentRequest: true,
                        paymentRequestUrl: paymentRequest.paymentRequestUrl,
                        mintIntentId: mintIntentId,
                        message: "Insufficient funds. Please complete payment to continue."
                    });

                } catch (fallbackError: any) {
                    console.error("[Mint API] Payment Request fallback failed:", fallbackError);
                    throw paymentError; // Throw original payment error if fallback also fails
                }
            }

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
            if ((randomItem as any).description) {
                itemToMint.description = (randomItem as any).description;
            }

            // Store the template ID for our database (regardless of format)
            const sourceTemplateId = (randomItem as any).id;

            // Only use templateId for HandCash if it looks like a valid HandCash ID (24-char hex)
            // Local debug templates often use UUIDs which would cause HandCash to error
            if (sourceTemplateId && /^[0-9a-fA-F]{24}$/.test(sourceTemplateId)) {
                itemToMint.templateId = sourceTemplateId;
            }

            if (!collectionId || !/^[0-9a-fA-F]{24}$/.test(collectionId)) {
                throw new Error(`Invalid Collection ID configuration: "${collectionId}". Must be a 24-character hex string.`);
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
                    paymentId: paymentIds[0],
                    metadata: {
                        mintedAt: new Date().toISOString(),
                        paymentIds,
                    }
                })

                const responsePayload: any = {
                    success: true,
                    item: {
                        id: mintedItem.id,
                        origin: mintedItem.origin,
                        name: mintedItem.name,
                        imageUrl: mintedItem.mediaDetails?.image?.url || (randomItem as any).imageUrl || (randomItem as any).image,
                        multimediaUrl: (randomItem as any).multimediaUrl,
                        rarity: mintedItem.rarity,
                        collectionId: collectionId!
                    }
                }
                if (includeSplitDetails) {
                    responsePayload.paymentSplits = paymentSplits.map(split => ({
                        destination: split.destination,
                        amountBsv: split.amountBsv
                    }))
                }
                return NextResponse.json(responsePayload)
            } else {
                throw new Error("Minting succeeded but no items were returned in the order")
            }
        } else {
            console.warn("[Mint API] MOCK MODE: Missing config. Business Token:", !!businessAuthToken, "Collection:", !!collectionId, "Payment Destinations:", hasPaymentDestinations)

            // Mock Mode Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mintedItemId = `mock-${Date.now()}`;
            const mintedItemOrigin = `mock-origin-${Date.now()}`;
            const imageUrl = (randomItem as any).imageUrl || (randomItem as any).image;

            // Log Mock Payment to DB
            const mockPriceBsv = 0.88;
            const mockSplits = buildMintSplits(mockPriceBsv, mintDestinations);
            const mockPaymentRequestBase = `mock-mint-${randomItem.id || 'random'}-${Date.now()}`;
            for (let i = 0; i < mockSplits.length; i++) {
                const split = mockSplits[i]
                if (split.amountBsv <= 0) continue

                const paymentId = randomUUID();
                paymentIds.push(paymentId)

                await savePayment({
                    id: paymentId,
                    paymentRequestId: `${mockPaymentRequestBase}-${i + 1}`,
                    transactionId: `mock-tx-${Date.now()}-${i + 1}`,
                    amount: split.amountBsv,
                    currency: "BSV",
                    paidBy: userHandle,
                    paidAt: new Date().toISOString(),
                    status: "completed",
                    metadata: {
                        type: "mint_payment_mock",
                        templateId: randomItem.id,
                        pool: randomItem.pool,
                        destination: split.destination,
                        splitIndex: i + 1,
                        splitCount: mockSplits.length,
                        paymentRequestBase: mockPaymentRequestBase
                    }
                })
            }

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
                paymentId: paymentIds[0],
                metadata: {
                    mockMode: true,
                    mintedAt: new Date().toISOString(),
                    paymentIds,
                }
            })

            const responsePayload: any = {
                success: true,
                item: {
                    id: mintedItemId,
                    origin: mintedItemOrigin,
                    name: randomItem.name,
                    imageUrl: imageUrl,
                    multimediaUrl: (randomItem as any).multimediaUrl,
                    rarity: (randomItem as any).rarity,
                    collectionId: collectionId || undefined
                }
            }
            if (includeSplitDetails) {
                responsePayload.paymentSplits = mockSplits.map(split => ({
                    destination: split.destination,
                    amountBsv: split.amountBsv
                }))
            }
            return NextResponse.json(responsePayload)
        }

    } catch (error: any) {
        console.error("[Mint API] Error:", error)
        return NextResponse.json(
            { error: error.message || "Minting failed" },
            { status: 500 }
        )
    }
}
