
import 'dotenv/config';
import { db } from "../lib/db";
import { itemTemplates, collections } from "../lib/schema";
import { v4 as uuidv4 } from "uuid";
import { resolve } from "path";
import fs from "fs";
import { inArray, eq } from "drizzle-orm";

// Rarity configurations (Reference)
const RARITY_SUPPLY = {
    "Legendary": 1,
    "Epic": 3,
    "Rare": 5,
    "Uncommon": 7
};

function slugify(text: string): string {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function prettifyName(filename: string): string {
    // SPECIAL RENAMES
    if (filename.includes("killa_visor")) return "Used Altyn";
    if (filename.includes("adidas_knight_armor")) return "Gopnik Knight Armor"; // Renamed

    let name = filename.replace(/\.(glb|png|jpg|jpeg)$/i, '');
    name = name.replace(/_/g, ' ');
    return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Explicit Mapping for Visual Rarity
// 
// Re-Added: Gopnik Knight Armor (Legendary)
// Total Items: 39
// 
// Balance (39 items):
// L: 16 (16)
// E: 10 (30)
// R: 7 (35)
// U: 6 (42) 
// Total: 16+30+35+42 = 123 Supply! Perfect.

const CURATED_RARITY: Record<string, string> = {
    // --- LEGENDARY (16) ---
    // The most impressive, gold, or unique items
    "angelic_monobloc": "Legendary",
    "golden_onion_crown": "Legendary",
    "monobloc_throne": "Legendary",
    "royal_gopnik_cuirass": "Legendary",
    "zone_artifact": "Legendary",
    "adidas_knight_armor": "Legendary", // Kept & Renamed
    "killa_visor": "Legendary", // Used Altyn
    "cyber_gopnik_sledge": "Legendary",
    "trojan_lada": "Legendary",
    "pigeon_chariot": "Legendary",
    "lada_cavalry_steed": "Legendary",
    "turbo_monobloc": "Legendary",
    "atomic_backpack": "Legendary",
    "propane_flamer": "Legendary",
    "concrete_sunflower_horse": "Legendary",
    "chrome_comrade_hammer": "Legendary",

    // --- EPIC (10) ---
    // Complex, weapons, or very cool items
    "concrete_sputnik_mace": "Epic",
    "bear_wrestling_gloves": "Epic",
    "tire_sword": "Epic",
    "panelka_tower": "Epic",
    "samogon_still": "Epic",
    "spring_rifle": "Epic",
    "concrete_island_diorama": "Epic",
    "carpet_camo_suit": "Epic",
    "carpet_shield": "Epic",
    "concrete_slab_shield": "Epic",

    // --- RARE (7) ---
    // Standard gear, smaller items
    "radioactive_vial": "Rare",
    "uranium_glass_plate": "Rare",
    "mechanic_ring": "Rare",
    "carpet_onesie_ushanka": "Rare",
    "rolling_pin_flail": "Rare",
    "padded_tracksuit_helmet": "Rare",
    "stone_soup": "Rare",

    // --- UNCOMMON (6) ---
    // The "Common"/Junk items
    "bread_armor_pigeon": "Uncommon",
    "carpet_cowl": "Uncommon",
    "lada_repair_kit": "Uncommon",
    "leather_satchel": "Uncommon",
    "phonebook_armor": "Uncommon",
    "stalker_ration_kit": "Uncommon",
};

async function seed() {
    console.log("🌱 Seeding Mint 2 item templates with CURATED VISUAL rarities...");

    const cachePath = resolve(process.cwd(), "mint2_cache.json");
    if (!fs.existsSync(cachePath)) {
        console.error("❌ mint2_cache.json not found.");
        process.exit(1);
    }

    const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    const items: Record<string, { image?: string, model?: string }> = {};

    for (const [filename, url] of Object.entries(cache)) {
        const baseName = filename.replace(/\.(glb|png)$/i, "");
        if (
            baseName === "atomic_turnover" ||
            baseName === "concrete_slab_jetpack" ||
            baseName === "tesla_coil_lada"
            // adidas_knight_armor is allowed again
        ) {
            continue;
        }
        if (!items[baseName]) items[baseName] = {};
        if (filename.endsWith(".glb")) items[baseName].model = url as string;
        else if (filename.endsWith(".png")) items[baseName].image = url as string;
    }

    const itemNames = Object.keys(items).sort();

    // Cleanup old items (including potential old name for adidas armor)
    const removedSlugs = [
        "atomic-turnover-mint2",
        "concrete-slab-jetpack-mint2",
        "tesla-coil-lada-mint2",
        "adidas-knight-armor-mint2", // We will recreate it as "Gopnik Knight Armor" (gopnik-knight-armor-mint2)
        "killa-visor-mint2"
    ];
    await db.delete(itemTemplates).where(inArray(itemTemplates.id, removedSlugs));
    console.log(`🗑️ Removed deprecated items: ${removedSlugs.join(", ")}`);

    // --- Collection ---
    const collectionId = "6973cd7135f5681f98ce551c";
    const collectionName = "Eastern Treasure";

    // Ensure collection exists in DB
    const existingCollection = await db.select().from(collections).where(eq(collections.id, collectionId));
    if (existingCollection.length === 0) {
        console.log(`Creating collection ${collectionName} (${collectionId})...`);
        await db.insert(collections).values({
            id: collectionId,
            name: collectionName,
            description: "The second generation of Slavic Survivors artifacts.",
            imageUrl: items[itemNames[0]]?.image || "",
            createdAt: new Date(),
        });
    } else if (existingCollection[0].name !== collectionName) {
        console.log(`Updating collection name to ${collectionName}...`);
        await db.update(collections).set({ name: collectionName }).where(eq(collections.id, collectionId));
    }

    // --- Seed ---
    let actualSupply = 0;
    const counts = { "Legendary": 0, "Epic": 0, "Rare": 0, "Uncommon": 0 };
    let unmapped: string[] = [];

    for (const baseName of itemNames) {
        let rarity = CURATED_RARITY[baseName];

        if (!rarity) {
            console.warn(`⚠️ Unmapped Item: ${baseName}. Defaulting to Uncommon.`);
            rarity = "Uncommon";
            unmapped.push(baseName);
        }

        const supplyKey = rarity as keyof typeof RARITY_SUPPLY;
        const supply = RARITY_SUPPLY[supplyKey];

        counts[supplyKey]++;
        actualSupply += supply;

        const prettyName = prettifyName(baseName);
        const slug = slugify(prettyName);
        const templateId = `${slug}-mint2`;

        try {
            await db.insert(itemTemplates).values({
                id: templateId,
                name: prettyName,
                description: `A ${rarity} item from Mint 2.`,
                imageUrl: items[baseName].image,
                multimediaUrl: items[baseName].model,
                collectionId: collectionId,
                rarity: rarity,
                pool: "mint2",
                supplyLimit: supply,
                attributes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                isArchived: false,
            }).onConflictDoUpdate({
                target: itemTemplates.id,
                set: {
                    name: prettyName,
                    imageUrl: items[baseName].image,
                    collectionId: collectionId,
                    rarity: rarity,
                    supplyLimit: supply,
                    pool: "mint2",
                    updatedAt: new Date(),
                    isArchived: false,
                }
            });
            console.log(`Updated ${prettyName} -> ${rarity} (Qty: ${supply})`);
        } catch (error) {
            console.error(`❌ Failed to seed ${prettyName}:`, error);
        }
    }

    console.log("------------------------------------------------");
    console.log(`✨ Seeding complete!`);
    console.log(`📊 Distribution Counts (Total Items: ${itemNames.length}):`);
    console.log(`   L: ${counts.Legendary} (Target 16)`);
    console.log(`   E: ${counts.Epic} (Target 10)`);
    console.log(`   R: ${counts.Rare} (Target 7)`);
    console.log(`   U: ${counts.Uncommon} (Target 6)`);
    console.log(`📊 Total Final Supply: ${actualSupply}`);
    if (unmapped.length > 0) console.log(`⚠️ Unmapped Items: ${unmapped.join(", ")}`);
    console.log("------------------------------------------------");
}

seed().catch(err => {
    console.error("💥 Fatal error during seeding:", err);
    process.exit(1);
});
