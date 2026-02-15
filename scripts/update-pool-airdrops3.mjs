
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function updatePools() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    // Load recent templates
    const templates = JSON.parse(fs.readFileSync("recent_templates.json", "utf-8"));

    // Separate Crowbar and Others
    const crowbar = templates.find(t => t.name.toLowerCase().includes("crowbar"));
    const others = templates.filter(t => !t.name.toLowerCase().includes("crowbar"));

    if (crowbar) {
        // Update Crowbar
        await sql`
            UPDATE item_templates 
            SET supply_limit = 0, updated_at = NOW()
            WHERE id = ${crowbar.id}
        `;
        console.log(`✅ Updated ${crowbar.name} -> Supply: 0`);
    } else {
        console.warn("⚠️ Crowbar of Destiny not found in recent_templates.json");
        // Fallback: try update by name in DB if missing from JSON? 
        // But it definitely should be there.
    }

    // Update Others
    for (const t of others) {
        await sql`
            UPDATE item_templates 
            SET pool = 'airdrops3', updated_at = NOW()
            WHERE id = ${t.id}
        `;
        console.log(`Updated ${t.name} -> Pool: 'airdrops3'`);
    }

    console.log(`\n✅ Update Complete. ${others.length} templates set to pool 'airdrops3'.`);
}

updatePools();
