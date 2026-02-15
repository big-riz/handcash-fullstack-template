
import dotenv from "dotenv";
dotenv.config();

async function probe(url: string, id: string) {
    const fullUrl = `${url}/${id}`;
    console.log(`Probing: ${fullUrl}`);
    try {
        const res = await fetch(fullUrl, {
            headers: {
                "app-id": process.env.HANDCASH_APP_ID!,
                "app-secret": process.env.HANDCASH_APP_SECRET!,
            }
        });
        if (res.ok) {
            const data = await res.json();
            return { url: fullUrl, data };
        } else {
            const text = await res.text();
            console.log(`  Failed: ${res.status} - ${text.substring(0, 100)}`);
            return null;
        }
    } catch (e: any) {
        console.log(`  Error: ${e.message}`);
        return null;
    }
}

async function main() {
    const id = "69912eda798fa5633307a932";
    const base = "https://cloud.handcash.io/v3";

    const endpoints = [
        `${base}/paymentRequests`,
        `${base}/paymentRequests/templates`,
        `${base}/paymentRequestTemplates`,
        `${base}/campaigns`,
        `${base}/items`,
        `${base}/collections`,
        `${base}/drops`,
        "https://cloud.handcash.io/v1/paymentRequests"
    ];

    for (const endpoint of endpoints) {
        const result = await probe(endpoint, id);
        if (result) {
            console.log("\n!!! FOUND !!!");
            console.log(`Endpoint: ${result.url}`);
            console.log("Data:", JSON.stringify(result.data, null, 2));
            process.exit(0);
        }
    }
    console.log("\nNot found anywhere.");
}

main();
