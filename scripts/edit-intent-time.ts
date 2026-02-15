
import { db } from "../lib/db";
import { mintIntents } from "../lib/schema";
import { eq, or } from "drizzle-orm";

async function main() {
    const targetId = "69912eda798fa5633307a932";
    console.log(`Searching for intent with ID or Payment Request ID matching: ${targetId}`);

    const intent = await db.query.mintIntents.findFirst({
        where: or(
            eq(mintIntents.id, targetId),
            eq(mintIntents.paymentRequestId, targetId)
        )
    });

    if (!intent) {
        console.error("No intent found with that ID.");
        process.exit(1);
    }

    console.log("Found intent:", JSON.stringify(intent, null, 2));

    const currentActivationTime = intent.activationTime ? new Date(intent.activationTime) : new Date();
    const newActivationTime = new Date(currentActivationTime.getTime() - 45 * 60 * 1000);

    console.log(`Current Activation Time: ${currentActivationTime.toISOString()}`);
    console.log(`New Activation Time:     ${newActivationTime.toISOString()} (45m earlier)`);

    await db.update(mintIntents)
        .set({
            activationTime: newActivationTime,
            updatedAt: new Date()
        })
        .where(eq(mintIntents.id, intent.id));

    console.log("Update successful.");
    process.exit(0);
}

main().catch(err => {
    console.error("Error updating intent:", err);
    process.exit(1);
});
