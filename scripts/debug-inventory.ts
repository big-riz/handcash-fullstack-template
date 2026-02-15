import 'dotenv/config';
import { getAccountClient, Connect } from "../lib/items-client";

async function debugInventory() {
    const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN;
    if (!businessAuthToken) {
        console.error("BUSINESS_AUTH_TOKEN not configured");
        return;
    }

    const accountClient = getAccountClient(businessAuthToken);
    const { data, error } = await Connect.getItemsInventory({
        client: accountClient,
        body: {},
    });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Raw Data Keys:", Object.keys(data as any));
    const items = (data as any)?.items || (Array.isArray(data) ? data : []);
    console.log("Item Count:", items.length);
    if (items.length > 0) {
        console.log("First Item Collection:", JSON.stringify(items[0].collection, null, 2));
    }
}

debugInventory().catch(console.error);
