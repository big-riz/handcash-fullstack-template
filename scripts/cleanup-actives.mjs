
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

// IDs from actives.ts
const idsToRemove = [
    "tt33", "shank", "knuckles", "stilleto", "dagger", "holywater", "cross", "salt", "stake",
    "ak_radioactive", "peppermill", "soviet_stick", "vampire_rat", "pig_luggage",
    "kabar", "grail", "propaganda_tower", "dadushka_chair", "tank_stroller",
    "gzhel_smg", "kvass_reactor", "skull_screen", "gopnik_gondola",
    "visors", "nuclear_pigeon", "haunted_lada", "big_biz_lada"
];

async function cleanup() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    try {
        // 1. Check for minted items using these templates
        const mintedCount = await sql`
            SELECT count(*) as count 
            FROM minted_items 
            WHERE template_id = ANY(${idsToRemove})
        `;

        if (mintedCount[0].count > 0) {
            console.log(`⚠️ Cannot delete templates: ${mintedCount[0].count} items have been minted using these templates.`);
            console.log("Aborting cleanup to preserve data integrity.");
            process.exit(0);
        }

        // 2. Delete templates
        const result = await sql`
            DELETE FROM item_templates 
            WHERE id = ANY(${idsToRemove})
            RETURNING id
        `;

        console.log(`✅ Removed ${result.length} templates from the database.`);

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    }
}

cleanup();
