
import dotenv from "dotenv";
dotenv.config();

async function probe(path: string) {
    const url = `https://cloud.handcash.io/v3/${path}`;
    const appId = process.env.HANDCASH_APP_ID!;
    const appSecret = process.env.HANDCASH_APP_SECRET!;

    console.log(`Probing: ${url}`);
    try {
        const res = await fetch(url, {
            headers: {
                "app-id": appId,
                "app-secret": appSecret,
            }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`  SUCCESS! Items: ${Array.isArray(data) ? data.length : (data.items ? data.items.length : 'Object')}`);
            if (JSON.stringify(data).includes("69912eda798fa5633307a932")) {
                console.log("  !!! TARGET ID FOUND HERE !!!");
                console.log(JSON.stringify(data, null, 2));
            }
        } else {
            // console.log(`  Failed: ${res.status}`);
        }
    } catch (e: any) {
        // console.log(`  Error: ${e.message}`);
    }
}

async function main() {
    const paths = [
        "paymentRequests",
        "paymentRequests/templates",
        "items/collections",
        "items/itemTemplates",
        "items/campaigns",
        "items/drops",
        "drops",
        "campaigns",
        "collections",
    ];

    for (const p of paths) {
        await probe(p);
    }
}

main();
