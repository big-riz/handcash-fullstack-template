
import { db } from "../lib/db";
import { payments } from "../lib/schema";
import { eq, or } from "drizzle-orm";

async function main() {
    const targetId = "69912eda798fa5633307a932";
    console.log(`Checking 'payments' table for ID or Payment Request ID matching: ${targetId}`);

    const payment = await db.query.payments.findFirst({
        where: or(
            eq(payments.id, targetId),
            eq(payments.paymentRequestId, targetId)
        )
    });

    if (payment) {
        console.log("Found in 'payments' table:", JSON.stringify(payment, null, 2));
    } else {
        console.log("Not found in 'payments' table.");
    }
    process.exit(0);
}

main().catch(err => {
    console.error("Error checking payments:", err);
    process.exit(1);
});
