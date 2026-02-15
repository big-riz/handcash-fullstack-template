
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

// Rarity mapping
const supplyMap = {
    "Legendary": 1,
    "Epic": 3,
    "Rare": 5,
    "Uncommon": 7,
    "Common": 0 // Assuming 0 for others or keep existing
};

async function updateSupply() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    // Read recent templates
    const templates = JSON.parse(fs.readFileSync("recent_templates.json", "utf-8"));

    console.log(`Updating supply limits for ${templates.length} templates...`);

    for (const t of templates) {
        const newSupply = supplyMap[t.rarity];
        if (newSupply !== undefined) {
            await sql`
                UPDATE item_templates 
                SET supply_limit = ${newSupply}, updated_at = NOW()
                WHERE id = ${t.id}
            `;
            console.log(`Updated ${t.name} (${t.rarity}) -> Supply: ${newSupply}`);
        } else {
            console.log(`Skipping ${t.name}: Unknown rarity ${t.rarity}`);
        }
    }
    console.log("✅ Update complete.");
}

updateSupply();
