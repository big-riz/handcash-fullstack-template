
import fs from 'fs';
import path from 'path';

const refPath = path.join(process.cwd(), 'item-templates-reference.json');
const data = JSON.parse(fs.readFileSync(refPath, 'utf-8'));

const mint2Items = data.templates.filter((t: any) => t.pool === 'mint2');

const categorized: Record<string, string[]> = {
    "Legendary": [],
    "Epic": [],
    "Rare": [],
    "Uncommon": []
};

mint2Items.forEach((item: any) => {
    if (categorized[item.rarity]) {
        categorized[item.rarity].push(item.name);
    }
});

console.log("\n=== MINT 2 DISTRIBUTION ===\n");

// Sort count descending order for rarities usually, but let's do L -> E -> R -> U
const order = ["Legendary", "Epic", "Rare", "Uncommon"];

let totalSupply = 0;

for (const rarity of order) {
    const items = categorized[rarity].sort();
    const supplyPerItem = mint2Items.find((t: any) => t.rarity === rarity)?.supplyLimit || 0;
    const tierSupply = items.length * supplyPerItem;
    totalSupply += tierSupply;

    console.log(`[${rarity.toUpperCase()}] (Qty: ${supplyPerItem} each | ${items.length} items | Total Supply: ${tierSupply})`);
    items.forEach(name => console.log(` - ${name}`));
    console.log("");
}

console.log(`TOTAL SUPPLY: ${totalSupply}`);
console.log(`TOTAL ITEMS: ${mint2Items.length}`);
