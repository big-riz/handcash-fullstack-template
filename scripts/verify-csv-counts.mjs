
import * as fs from "fs";

const csvFile = "group_assignments.csv";
const content = fs.readFileSync(csvFile, "utf-8");
const lines = content.split("\n").filter(l => l.trim().length > 0);

// Headers: Player,Group,Score,Item 1,Item 2,Item 3
// Skip header
const dataLines = lines.slice(1);

const itemCounts = {};
const itemRarities = {};

let totalItemsList = 0;

for (const line of dataLines) {
    // Parse CSV line. Handle quotes.
    // Regex for: val,val,val,"item","item","item"
    // Extract items from indices 3, 4, 5
    // Simple split by comma might break on items with commas, but our items don't have commas in names (verified earlier)
    // But they are wrapped in quotes.

    // Better parser:
    const parts = [];
    let current = "";
    let inQuote = false;
    for (const char of line) {
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            parts.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    parts.push(current);

    if (parts.length < 6) continue;

    const items = [parts[3], parts[4], parts[5]];

    items.forEach(rawItem => {
        // Strip quotes if present (parser usually keeps content inside quotes, but my logic kept delimiters? No, loop logic accumulated chars)
        // Wait, loop logic logic: `current += char`. It didn't skip quotes. So `"` is included.
        let itemStr = rawItem.replace(/^"|"$/g, "").trim();

        if (!itemStr) return;

        // Parse Name and Rarity
        // "Name (Rarity)"
        const match = itemStr.match(/^(.+) \((.+)\)$/);
        if (match) {
            const name = match[1];
            const rarity = match[2];

            if (!itemCounts[name]) itemCounts[name] = 0;
            itemCounts[name]++;
            itemRarities[name] = rarity;
            totalItemsList++;
        } else {
            console.warn(`Could not parse item: ${itemStr}`);
        }
    });
}

console.log(`\n--- Verification Report ---`);
console.log(`Total Assignments: ${dataLines.length}`);
console.log(`Total Items Distrubuted: ${totalItemsList}`);

const supplyLimits = {
    "Legendary": 1,
    "Epic": 3,
    "Rare": 5,
    "Uncommon": 7
};

console.log(`\n--- Item Counts vs Supply Limits ---`);
let allValid = true;


// Expected Items List (19 Templates)
const expectedItems = [
    { name: "Kharkovchanka", rarity: "Legendary" },
    { name: "Dr. Squat's Reflex Hammer", rarity: "Legendary" },
    { name: "Crowbar of Destiny", rarity: "Legendary" },
    { name: "Hussar Armor", rarity: "Epic" },
    { name: "Slavic Crusader Armor", rarity: "Epic" },
    { name: "Eastern Golem", rarity: "Epic" },
    { name: "Matryoshka Grenade", rarity: "Epic" },
    { name: "Tsar Tank", rarity: "Epic" },
    { name: "Ushanka Gas Mask", rarity: "Epic" },
    { name: "Gop Gargoyle", rarity: "Rare" },
    { name: "Nuclear Spinner", rarity: "Rare" },
    { name: "Bio Phone", rarity: "Rare" },
    { name: "Ruggage", rarity: "Rare" },
    { name: "Premium Used Lada", rarity: "Rare" },
    { name: "Gold Leaf Slipper", rarity: "Uncommon" },
    { name: "Brick Phone", rarity: "Uncommon" },
    { name: "Doily Bra", rarity: "Uncommon" },
    { name: "Wobbly Nuclear Spinner", rarity: "Uncommon" },
    { name: "Used Lada", rarity: "Uncommon" }
];

console.log(`\n--- Item Utilization Report ---`);

let leftOutCount = 0;

for (const tmpl of expectedItems) {
    const name = tmpl.name;
    const rarity = tmpl.rarity;
    const limit = supplyLimits[rarity];
    const found = itemCounts[name] || 0;

    const usedStatus = found === limit ? "FULL" : `PARTIAL (${limit - found} unused)`;
    if (found < limit) leftOutCount += (limit - found);

    console.log(`${name.padEnd(30)} [${rarity.padEnd(10)}] Used: ${found}/${limit}  ${usedStatus}`);
}

console.log(`\nTotal Unused Items: ${leftOutCount}`);


const sortedNames = Object.keys(itemCounts).sort();

for (const name of sortedNames) {
    const count = itemCounts[name];
    const rarity = itemRarities[name];
    const limit = supplyLimits[rarity] || 0;

    const status = count <= limit ? "✅ OK" : "❌ EXCEEDED";
    if (count > limit) allValid = false;

    console.log(`${name.padEnd(30)} [${rarity.padEnd(10)}] Found: ${count} / Limit: ${limit}  ${status}`);
}

if (allValid) {
    console.log(`\n✅ SUCCESS: All item counts are within supply limits.`);
} else {
    console.log(`\n❌ FAILURE: Some supply limits were exceeded.`);
    process.exit(1);
}
