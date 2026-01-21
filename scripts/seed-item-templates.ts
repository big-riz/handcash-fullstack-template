import { db } from "../lib/db";
import { itemTemplates, collections } from "../lib/schema";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function seed() {
    console.log("🌱 Seeding item templates...");

    const existingCollections = await db.select().from(collections);

    if (existingCollections.length === 0) {
        console.error("❌ No collections found in database. Please create a collection first in the Admin dashboard.");
        process.exit(1);
    }

    const targetCollectionId = existingCollections[0].id;
    console.log(`📦 Targeted collection: ${existingCollections[0].name} (${targetCollectionId})`);

    const gopnikTemplates = [
        {
            id: "adidas-tracksuit-template",
            name: "Adidas Tracksuit",
            description: "Essential gear for any self-respecting gopnik.",
            imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tracksuit_blue.png",
            collectionId: targetCollectionId,
            rarity: "Common",
            attributes: [
                { name: "Brand", value: "Abibas", displayType: "string" },
                { name: "Style", value: "Three Stripes", displayType: "string" }
            ],
        },
        {
            id: "sunflower-seeds-template",
            name: "Sunflower Seeds",
            description: "The fuel of champions. Semechki for life.",
            imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/seeds.png",
            collectionId: targetCollectionId,
            rarity: "Common",
            attributes: [
                { name: "Flavor", value: "Roasted", displayType: "string" },
                { name: "Salt", value: "Heavy", displayType: "string" }
            ],
        },
        {
            id: "kv2-tank-model-template",
            name: "KV-2 Tank Model",
            description: "The fridge on tracks. Solid steel, peak engineering.",
            imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/tank.png",
            multimediaUrl: "https://res.cloudinary.com/handcash-io/raw/upload/v1710255990/items/kv2.glb",
            collectionId: targetCollectionId,
            rarity: "Rare",
            attributes: [
                { name: "Era", value: "WWII", displayType: "string" },
                { name: "Material", value: "Steel", displayType: "string" }
            ],
        },
        {
            id: "gold-chain-template",
            name: "Gold Chain",
            description: "Heavy enough to show you're boss, light enough to run from OMON.",
            imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/gold_chain.png",
            collectionId: targetCollectionId,
            rarity: "Epic",
            attributes: [
                { name: "Purity", value: "24K (Allegedly)", displayType: "string" },
                { name: "Weight", value: "CHUNKY", displayType: "string" }
            ],
        },
        {
            id: "golden-ushanka-template",
            name: "Golden Ushanka",
            description: "The ultimate trophy. Warm, shiny, legendary.",
            imageUrl: "https://res.cloudinary.com/handcash-io/image/upload/v1710255990/items/ushanka.png",
            collectionId: targetCollectionId,
            rarity: "Legendary",
            attributes: [
                { name: "Power Level", value: "Over 9000", displayType: "number" },
                { name: "Warmth", value: "Maximum", displayType: "string" }
            ],
        }
    ];

    for (const template of gopnikTemplates) {
        try {
            await db.insert(itemTemplates).values({
                ...template,
                createdAt: new Date(),
            }).onConflictDoUpdate({
                target: itemTemplates.id,
                set: {
                    name: template.name,
                    description: template.description,
                    imageUrl: template.imageUrl,
                    multimediaUrl: (template as any).multimediaUrl,
                    rarity: template.rarity,
                    attributes: template.attributes,
                    updatedAt: new Date()
                }
            });
            console.log(`✅ Upserted template: ${template.name}`);
        } catch (error) {
            console.error(`❌ Failed to upsert ${template.name}:`, error);
        }
    }

    console.log("✨ Seeding complete!");
}

seed().catch(err => {
    console.error("💥 Fatal error during seeding:", err);
    process.exit(1);
});
