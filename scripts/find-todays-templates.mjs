
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function queryRecentTemplates() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);
    try {
        // Query templates created in the last 24 hours
        // Using raw SQL interval for safety
        const templates = await sql`
            SELECT id, name, created_at, rarity, supply_limit 
            FROM item_templates 
            WHERE created_at > '2026-02-13'
            ORDER BY created_at DESC
        `;

        fs.writeFileSync("recent_templates.json", JSON.stringify(templates, null, 2));
        console.log(`Saved ${templates.length} templates to recent_templates.json`);

    } catch (error) {
        console.error("Error:", error);
    }
}

queryRecentTemplates();
