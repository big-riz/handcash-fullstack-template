
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function updateHandles() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    // Get distinct handles
    const result = await sql`
        SELECT DISTINCT minted_to_handle 
        FROM minted_items 
        WHERE minted_to_handle IS NOT NULL
    `;

    const handles = result.map(r => r.minted_to_handle).sort((a, b) => a.localeCompare(b));

    // Save to file
    fs.writeFileSync("unique-handles.json", JSON.stringify(handles, null, 2));
    console.log(`Updated unique-handles.json with ${handles.length} handles.`);
}

updateHandles();
