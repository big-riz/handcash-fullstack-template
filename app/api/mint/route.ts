import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { getMinter, resolveHandlesToUserIds } from "@/lib/items-client"
import { getCollections } from "@/lib/collections-storage"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { recordMintedItem } from "@/lib/minted-items-storage"
import { getTemplates } from "@/lib/item-templates-storage"

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
        const dbTemplates = await getTemplates()

        // Hardcoded fallbacks if DB is empty
        const fallbackItemTypes = [
            { name: "Adidas Tracksuit", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tracksuit_blue.png" },
            { name: "Sunflower Seeds", rarity: "Common", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/seeds.png" },
            { name: "KV-2 Tank Model", rarity: "Rare", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tank.png" },
            { name: "Gold Chain", rarity: "Epic", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/gold_chain.png" },
            { name: "Golden Ushanka", rarity: "Legendary", imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/ushanka.png" }
        ]

        // Choose template at random
        const itemPool = dbTemplates.length > 0 ? dbTemplates : fallbackItemTypes;
        const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)]

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

        if (!isMockMode) {
            console.log(`[Mint API] Real Mode: Minting ${randomItem.name} to ${userHandle} using collection ${collectionId}`)

            // 5. Process Payment (User -> Business)
            const rateData = await handcashService.getExchangeRate("USD")
            const rate = typeof rateData === "number" ? rateData : ((rateData as any)?.rate || (rateData as any)?.exchangeRate);

            if (!rate || typeof rate !== "number") {
                console.error("[Mint API] Invalid rate data:", rateData)
                throw new Error("Could not fetch valid exchange rate")
            }

            const priceUsd = 0.25;
            const bsvAmount = priceUsd / rate;
            const roundedBsvAmount = Math.ceil(bsvAmount * 100000000) / 100000000;

            console.log(`[Mint API] Processing payment of ${roundedBsvAmount} BSV to ${businessHandle}`)

            await handcashService.sendPayment(privateKey, {
                destination: businessHandle!,
                amount: roundedBsvAmount,
                currency: "BSV",
                description: `Mint Item: ${randomItem.name}`
            })

            // 6. Mint Item (Business -> User)
            const handleMap = await resolveHandlesToUserIds([userHandle], businessAuthToken!)
            const destinationUserId = handleMap[userHandle.toLowerCase()]

            if (!destinationUserId) throw new Error("Could not resolve user ID for minting")

            const minter = getMinter()

            // Construct the item definition for minting (always include metadata to avoid validation errors)
            const itemToMint: any = {
                user: destinationUserId,
                quantity: 1,
                name: randomItem.name,
                rarity: (randomItem as any).rarity,
                mediaDetails: {
                    image: {
                        url: (randomItem as any).imageUrl || (randomItem as any).image,
                        contentType: "image/png"
                    }
                },
                attributes: (randomItem as any).attributes || [
                    { name: "Type", value: "Gear", displayType: "string" },
                    { name: "Rarity", value: (randomItem as any).rarity, displayType: "string" }
                ]
            }

            // Only use templateId if it looks like a valid HandCash ID (24-char hex)
            // Local debug templates often use UUIDs which would cause HandCash to error
            const itemId = (randomItem as any).id;
            if (itemId && /^[0-9a-fA-F]{24}$/.test(itemId)) {
                itemToMint.templateId = itemId;
            }

            const creationOrder = await minter.createItemsOrder({
                collectionId: collectionId!,
                items: [itemToMint]
            })

            const items = await minter.getOrderItems(creationOrder.id)

            if (items && items.length > 0) {
                const mintedItem = items[0] as any;

                // Record in DB
                await recordMintedItem({
                    id: mintedItem.id,
                    origin: mintedItem.origin,
                    collectionId: collectionId!,
                    templateId: itemToMint.templateId,
                    mintedToUserId: userId,
                    mintedToHandle: userHandle,
                    itemName: mintedItem.name,
                    rarity: mintedItem.rarity,
                    imageUrl: mintedItem.mediaDetails?.image?.url || (randomItem as any).imageUrl || (randomItem as any).image,
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
