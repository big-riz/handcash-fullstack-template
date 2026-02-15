
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function updateRecentTemplates() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log("Fetching item templates from database...");

        // Get only items created today (2026-02-14) with supply_limit > 0
        const templates = await sql`
            SELECT * FROM item_templates 
            WHERE DATE(created_at) = '2026-02-14'
            AND supply_limit > 0
            ORDER BY created_at DESC
        `;

        const simplifiedTemplates = templates.map(t => ({
            id: t.id,
            name: t.name,
            created_at: t.created_at,
            rarity: t.rarity,
            supply_limit: t.supply_limit
        }));

        const outputPath = resolve(process.cwd(), "recent_templates.json");
        writeFileSync(outputPath, JSON.stringify(simplifiedTemplates, null, 2));

        console.log(`✅ Updated recent_templates.json with ${simplifiedTemplates.length} templates from today (2026-02-14) with supply_limit > 0.`);

        // Log counts by rarity
        const counts = {};
        simplifiedTemplates.forEach(t => {
            counts[t.rarity] = (counts[t.rarity] || 0) + 1;
        });
        console.log("Counts by rarity:", counts);

    } catch (error) {
        console.error("❌ Error fetching templates:", error);
        process.exit(1);
    }
}

updateRecentTemplates();
