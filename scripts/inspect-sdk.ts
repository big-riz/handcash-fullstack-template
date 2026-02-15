
import { Connect } from "@handcash/sdk";

console.log("Connect object keys:");
console.log(Object.keys(Connect));

const subKeys = {};
for (const key of Object.keys(Connect)) {
    if (typeof (Connect as any)[key] === 'object' && (Connect as any)[key] !== null) {
        (subKeys as any)[key] = Object.keys((Connect as any)[key]);
    }
}
console.log("\nSub-keys:");
console.log(JSON.stringify(subKeys, null, 2));
