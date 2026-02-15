
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function updateHussar() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    await sql`
        UPDATE item_templates 
        SET rarity = 'Legendary', supply_limit = 1, updated_at = NOW()
        WHERE name = 'Hussar Armor'
    `;

    console.log("✅ Updated 'Hussar Armor' to Legendary (Supply: 1)");
}

updateHussar();
