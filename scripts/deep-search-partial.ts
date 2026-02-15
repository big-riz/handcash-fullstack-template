
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    const target = "69912eda";
    console.log(`Searching database for partial: ${target}`);

    const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);

    for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        const columnsResult = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
        `);

        for (const colRow of columnsResult.rows) {
            const colName = colRow.column_name;
            try {
                const searchResult = await db.execute(sql.raw(`
                    SELECT * FROM ${tableName} 
                    WHERE CAST(${colName} AS TEXT) LIKE '%${target}%'
                `));

                if (searchResult.rowCount > 0) {
                    console.log(`FOUND IN TABLE: ${tableName}, COLUMN: ${colName}`);
                    console.log(JSON.stringify(searchResult.rows, null, 2));
                }
            } catch (e) {
            }
        }
    }
    console.log("Search complete.");
    process.exit(0);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
