
import dotenv from "dotenv";
dotenv.config();

async function listAll() {
    const appId = process.env.HANDCASH_APP_ID!;
    const appSecret = process.env.HANDCASH_APP_SECRET!;
    const url = "https://cloud.handcash.io/v3/paymentRequests";

    console.log(`Listing Payment Requests from ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                "app-id": appId,
                "app-secret": appSecret,
            }
        });

        if (res.ok) {
            const data = await res.json();
            const items = data.items || data;
            console.log(`Found ${items.length} items.`);
            items.forEach((item: any) => {
                console.log(`ID: ${item.id} - Name: ${item.productName} - Created: ${item.createdAt}`);
            });

            // Search for the specific ID
            const targetId = "69912eda798fa5633307a932";
            const match = items.find((i: any) => i.id === targetId);
            if (match) {
                console.log("\nMATCH FOUND!");
                console.log(JSON.stringify(match, null, 2));
            } else {
                console.log(`\nTarget ID ${targetId} not found in listing.`);
            }
        } else {
            const text = await res.text();
            console.error(`Error ${res.status}: ${text}`);
        }
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

listAll();
