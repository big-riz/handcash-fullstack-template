
import dotenv from "dotenv";
dotenv.config();

async function listItems(url: string, label: string) {
    console.log(`\n--- Listing ${label} (${url}) ---`);
    try {
        const res = await fetch(url, {
            headers: {
                "app-id": process.env.HANDCASH_APP_ID!,
                "app-secret": process.env.HANDCASH_APP_SECRET!,
            }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log(`  Failed: ${res.status} - ${text.substring(0, 200)}`);
        }
    } catch (e: any) {
        console.log(`  Error: ${e.message}`);
    }
}

async function main() {
    const base = "https://cloud.handcash.io/v3";

    // Try different possible listing endpoints
    await listItems(`${base}/paymentRequests`, "Payment Requests");
    await listItems(`${base}/paymentRequests/templates`, "Payment Request Templates");
    await listItems(`${base}/campaigns`, "Campaigns");
}

main();
