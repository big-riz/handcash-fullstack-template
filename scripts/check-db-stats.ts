
import "dotenv/config";
import { db } from "../lib/db";
import { mintIntents, payments } from "../lib/schema";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const intentsCount = await db.select({ count: sql<number>`count(*)` }).from(mintIntents);
        const paymentsCount = await db.select({ count: sql<number>`count(*)` }).from(payments);

        console.log("Database Stats:");
        console.log(`Mint Intents: ${intentsCount[0].count}`);
        console.log(`Payments: ${paymentsCount[0].count}`);

        if (intentsCount[0].count > 0) {
            const recent = await db.query.mintIntents.findMany({ limit: 5, orderBy: (m, { desc }) => [desc(m.createdAt)] });
            console.log("Recent Intents:", JSON.stringify(recent, null, 2));
        }
    } catch (err) {
        console.error("Error checking database:", err);
    }
    process.exit(0);
}

check();
