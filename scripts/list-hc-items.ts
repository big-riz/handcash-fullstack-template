
import dotenv from "dotenv";
dotenv.config();
import { HandCashService } from "../lib/handcash-service";

const handcashService = new HandCashService();

async function main() {
    console.log("Listing HandCash Payment Request Templates...");
    try {
        const url = "https://cloud.handcash.io/v3/paymentRequests/templates";
        const response = await fetch(url, {
            headers: {
                "app-id": process.env.HANDCASH_APP_ID!,
                "app-secret": process.env.HANDCASH_APP_SECRET!,
            }
        });
        const data = await response.json();
        console.log("Templates found:", JSON.stringify(data, null, 2));

        console.log("\nListing HandCash Payment Requests...");
        const response2 = await fetch("https://cloud.handcash.io/v3/paymentRequests", {
            headers: {
                "app-id": process.env.HANDCASH_APP_ID!,
                "app-secret": process.env.HANDCASH_APP_SECRET!,
            }
        });
        const data2 = await response2.json();
        console.log("Payment Requests found:", JSON.stringify(data2, null, 2));

    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

main();
