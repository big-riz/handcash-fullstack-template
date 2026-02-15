
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function listMinters() {
    console.log("🔍 Querying unique minters...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        // Query for unique user handles and IDs who have minted items
        // We'll group by handle to make it readable, but also grab ID to be sure
        const result = await sql`
            SELECT DISTINCT minted_to_handle, minted_to_user_id 
            FROM minted_items 
            WHERE minted_to_handle IS NOT NULL OR minted_to_user_id IS NOT NULL
        `;

        // Process results to get a unique list of "User Identifiers"
        // Prefer handle, fallback to ID if handle is missing
        const uniqueUsers = new Set();
        const userDetails = [];

        for (const row of result) {
            let identifier = row.minted_to_handle;
            if (!identifier) {
                identifier = `ID:${row.minted_to_user_id}`;
            }

            if (!uniqueUsers.has(identifier)) {
                uniqueUsers.add(identifier);
                userDetails.push({
                    handle: row.minted_to_handle || "N/A",
                    id: row.minted_to_user_id || "N/A",
                    display: identifier
                });
            }
        }

        console.log(`\n👥 Unique Minters Found: ${uniqueUsers.size}`);
        console.log("----------------------------------------");

        userDetails.sort((a, b) => a.display.localeCompare(b.display));

        userDetails.forEach((user, index) => {
            console.log(`${index + 1}. ${user.display} (ID: ${user.id})`);
        });

        console.log("----------------------------------------");

    } catch (error) {
        console.error("❌ Error querying database:", error);
        process.exit(1);
    }
}

listMinters();
