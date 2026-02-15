
import dotenv from "dotenv";
dotenv.config();

async function listAll(method: string, url: string, headers: any) {
    console.log(`\n--- ${method} ${url} ---`);
    try {
        const res = await fetch(url, {
            method,
            headers
        });
        if (res.ok) {
            const data = await res.json();
            console.log("SUCCESS!");
            const strData = JSON.stringify(data);
            if (strData.includes("69912eda798fa5633307a932")) {
                console.log("!!! TARGET ID FOUND !!!");
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(`Found ${strData.length} chars of data. Target not found.`);
                // console.log(strData.substring(0, 500));
            }
        } else {
            console.log(`Failed: ${res.status}`);
        }
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

async function main() {
    const appId = process.env.HANDCASH_APP_ID!;
    const appSecret = process.env.HANDCASH_APP_SECRET!;
    const authToken = process.env.BUSINESS_AUTH_TOKEN!;

    const endpoints = [
        "https://cloud.handcash.io/v3/paymentRequests",
        "https://cloud.handcash.io/v3/items/collections",
        "https://cloud.handcash.io/v3/items/itemTemplates",
    ];

    for (const url of endpoints) {
        // Try with App Credentials
        await listAll("GET", url, {
            "app-id": appId,
            "app-secret": appSecret
        });

        // Try with Bearer Token (Business)
        await listAll("GET", url, {
            "Authorization": `Bearer ${authToken}`
        });
    }
}

main();
