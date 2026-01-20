import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function check() {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL");
        return;
    }
    const sql = neon(process.env.DATABASE_URL);
    const results = await sql`SELECT * FROM collections`;
    console.log(JSON.stringify(results));
}

check();
