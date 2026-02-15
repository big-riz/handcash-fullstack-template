
import 'dotenv/config'
import { HandCashConnect } from '@handcash/handcash-connect'

async function main() {
    const appId = process.env.HANDCASH_APP_ID;
    const appSecret = process.env.HANDCASH_APP_SECRET;
    const authToken = process.env.BUSINESS_AUTH_TOKEN;

    if (!appId || !appSecret || !authToken) {
        console.error("Missing credentials");
        process.exit(1);
    }

    try {
        const handCashConnect = new HandCashConnect({ appId, appSecret });
        const account = handCashConnect.getAccountFromAuthToken(authToken);

        // Let's try to find collections via the issuance API if we have access
        // Or just list recent payments/items.
        // There is no easy "item.getCollections" in the standard connect SDK account object.
        // It's usually on the "minter" or "issuace" client.

        console.log("Fetching account profile...");
        const profile = await account.profile.getCurrentProfile();
        console.log("Profile:", profile.publicProfile.handle);

        // Try to list orders - sometimes collections are mentioned there
        // Actually, let's just use the HandCash Service to list inventory again but log the FULL item object

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
