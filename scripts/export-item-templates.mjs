import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function exportTemplates() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Query all item templates
        const templates = await sql`SELECT * FROM item_templates ORDER BY rarity, name`;
        
        // Query collections for reference
        const collections = await sql`SELECT * FROM collections`;
        
        // Query minted items count per template
        const mintCounts = await sql`
            SELECT template_id, COUNT(*) as count 
            FROM minted_items 
            WHERE is_archived = false 
            GROUP BY template_id
        `;
        
        const mintCountMap = {};
        mintCounts.forEach(mc => {
            if (mc.template_id) {
                mintCountMap[mc.template_id] = parseInt(mc.count);
            }
        });
        
        // Build comprehensive JSON
        const data = {
            metadata: {
                generatedAt: new Date().toISOString(),
                source: "Live Database Query",
                databaseUrl: process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || "neon.tech",
                totalTemplates: templates.length,
                totalCollections: collections.length
            },
            collections: collections.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                imageUrl: c.image_url,
                createdAt: c.created_at
            })),
            templates: templates.map(t => {
                const minted = mintCountMap[t.id] || 0;
                const remaining = t.supply_limit > 0 ? Math.max(0, t.supply_limit - minted) : "unlimited";
                
                return {
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    rarity: t.rarity,
                    pool: t.pool || "default",
                    supplyLimit: t.supply_limit || 0,
                    minted: minted,
                    remaining: remaining,
                    imageUrl: t.image_url,
                    multimediaUrl: t.multimedia_url,
                    collectionId: t.collection_id,
                    attributes: t.attributes,
                    color: t.color,
                    isArchived: t.is_archived,
                    createdAt: t.created_at,
                    updatedAt: t.updated_at
                };
            }),
            imageUrlMapping: {},
            rarityDistribution: {},
            pools: {},
            mintingProgress: {
                totalMinted: Object.values(mintCountMap).reduce((sum, count) => sum + count, 0),
                byTemplate: mintCountMap
            }
        };
        
        // Build image URL mapping
        templates.forEach(t => {
            if (t.image_url) {
                const filename = t.image_url.split('/').pop();
                data.imageUrlMapping[filename] = t.name;
            }
        });
        
        // Build rarity distribution
        templates.forEach(t => {
            const rarity = t.rarity || "Unknown";
            if (!data.rarityDistribution[rarity]) {
                data.rarityDistribution[rarity] = {
                    count: 0,
                    totalSupply: 0,
                    minted: 0,
                    items: []
                };
            }
            data.rarityDistribution[rarity].count++;
            data.rarityDistribution[rarity].totalSupply += t.supply_limit || 0;
            data.rarityDistribution[rarity].minted += mintCountMap[t.id] || 0;
            data.rarityDistribution[rarity].items.push(t.name);
        });
        
        // Build pools
        templates.forEach(t => {
            const pool = t.pool || "default";
            if (!data.pools[pool]) {
                data.pools[pool] = {
                    name: pool.charAt(0).toUpperCase() + pool.slice(1) + " Pool",
                    itemCount: 0,
                    totalSupply: 0,
                    totalMinted: 0,
                    templates: []
                };
            }
            data.pools[pool].itemCount++;
            data.pools[pool].totalSupply += t.supply_limit || 0;
            data.pools[pool].totalMinted += mintCountMap[t.id] || 0;
            data.pools[pool].templates.push(t.id);
        });
        
        // Write to file
        const outputPath = resolve(process.cwd(), "item-templates-reference.json");
        writeFileSync(outputPath, JSON.stringify(data, null, 2));
        
        console.log("✅ Exported item templates to:", outputPath);
        console.log(`📊 Total templates: ${templates.length}`);
        console.log(`📦 Total collections: ${collections.length}`);
        console.log(`🎯 Total minted: ${data.mintingProgress.totalMinted}`);
        console.log("\n📋 Templates by rarity:");
        Object.entries(data.rarityDistribution).forEach(([rarity, stats]) => {
            console.log(`   ${rarity}: ${stats.count} items (${stats.minted}/${stats.totalSupply} minted)`);
        });
        
    } catch (error) {
        console.error("❌ Error querying database:", error);
        process.exit(1);
    }
}

exportTemplates();
