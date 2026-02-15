import 'dotenv/config';
import { getSetting } from "../lib/settings-storage";

async function check() {
    const ids = await getSetting("authorized_collection_ids");
    console.log("Current Authorized IDs:", ids);
}

check().catch(console.error);
