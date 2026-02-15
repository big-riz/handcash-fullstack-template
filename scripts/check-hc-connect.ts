
import * as dotenv from 'dotenv';
dotenv.config();
import { HandCashConnect } from '@handcash/handcash-connect';

async function main() {
    const appId = process.env.HANDCASH_APP_ID!;
    const appSecret = process.env.HANDCASH_APP_SECRET!;
    const authToken = process.env.BUSINESS_AUTH_TOKEN!;

    const handCashConnect = new HandCashConnect({
        appId,
        appSecret,
    });

    const account = handCashConnect.getAccountFromAuthToken(authToken);
    const targetId = "69912eda798fa5633307a932";

    console.log(`Checking HandCash Connect account for ID: ${targetId}`);

    try {
        // Try to get payment request details if it's a payment request
        // In some versions of the SDK, this might be available.
        // But the SDK usually works with payments you *sent*.

        // Let's try to list payment requests if the method exists
        console.log("Checking for payment request...");
        // This is a bit of a guess on the method name since I can't see the types easily
        const res = await (account as any).payments.getPaymentRequest(targetId);
        console.log("SUCCESS! Found payment request:");
        console.log(JSON.stringify(res, null, 2));
    } catch (e: any) {
        console.log(`  Failed: ${e.message}`);
    }

    try {
        console.log("Checking for item templates...");
        // Use the minter if relevant
        const { HandCashMinter } = await import('@handcash/handcash-connect');
        const minter = HandCashMinter.fromAppCredentials({
            appId,
            appSecret,
            authToken,
        });

        // This might be where 'availableTime' lives for a drop
        const inventory = await minter.getInventory();
        const match = inventory.find((i: any) => i.id === targetId || i.origin === targetId);
        if (match) {
            console.log("SUCCESS! Found in minter inventory:");
            console.log(JSON.stringify(match, null, 2));
        } else {
            console.log("Not found in minter inventory.");
        }
    } catch (e: any) {
        console.log(`  Failed: ${e.message}`);
    }
}

main();
