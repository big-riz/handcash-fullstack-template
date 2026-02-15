
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Listing all tables in the database...");
    const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);

    console.log("Tables found:");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error("Error listing tables:", err);
    process.exit(1);
});
