
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function listTemplates() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);
    try {
        // Fetch all templates
        const templates = await sql`SELECT id, name, created_at FROM item_templates ORDER BY created_at DESC`;

        console.log(`Found ${templates.length} templates.`);
        console.log("----------------------------------------");
        templates.forEach(t => console.log(`- ${t.name} (ID: ${t.id}) - Created: ${t.created_at}`));
        console.log("----------------------------------------");
    } catch (error) {
        console.error("Error:", error);
    }
}

listTemplates();
