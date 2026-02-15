
import * as fs from "fs";

// Load templates
const templates = JSON.parse(fs.readFileSync("recent_templates.json", "utf-8"));

// Define weights based on supply limit
// Legendary (1), Epic (3), Rare (5), Uncommon (7)
const supplyMap = {
    "Legendary": 1,
    "Epic": 3,
    "Rare": 5,
    "Uncommon": 7
};

const weightedTemplates = templates.map(t => ({
    name: t.name,
    rarity: t.rarity,
    weight: supplyMap[t.rarity] || 1
}));

const totalWeight = weightedTemplates.reduce((sum, t) => sum + t.weight, 0);

function selectItem() {
    let r = Math.random() * totalWeight;
    for (const t of weightedTemplates) {
        if (r < t.weight) return t;
        r -= t.weight;
    }
    return weightedTemplates[weightedTemplates.length - 1];
}




const output = [];
output.push(`Generating 26 evenly balanced subgroups (Finite Supply Distribution)...\n`);
output.push(`(Supply Limits enforced: Legendary=1, Epic=3, Rare=5, Uncommon=7)\n`);

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const supplyDeck = [];

// 1. Build the "Deck" of actual items based on supply limits
// templates is the source list of 19 types
for (const t of templates) {
    const count = supplyMap[t.rarity] || 0;
    const weight = supplyMap[t.rarity]; // Score weight
    for (let k = 0; k < count; k++) {
        supplyDeck.push({
            name: t.name,
            rarity: t.rarity,
            weight: weight
        });
    }
}

// 2. Shuffle the deck to ensure randomness in which 11 are left out
for (let i = supplyDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [supplyDeck[i], supplyDeck[j]] = [supplyDeck[j], supplyDeck[i]];
}

// Total required items: 26 groups * 3 = 78 items.
// Total available: 89 items.
// We will use the first 78 items from the shuffled deck.
const itemsToDistribute = supplyDeck.slice(0, 78);

// 3. Sort items by weight descending (7 -> 1) to aid balancing
itemsToDistribute.sort((a, b) => b.weight - a.weight);

// 4. Initialize groups
const groups = letters.map(name => ({
    name,
    items: [],
    score: 0
}));

// 5. Distribute items securely to balance scores
// Always add the next item to the group with the LOWEST current score THAT HAS ROOM (<3 items)
for (const item of itemsToDistribute) {
    // Filter to groups with space
    const eligibleGroups = groups.filter(g => g.items.length < 3);

    // Sort eligible groups by score ascending
    eligibleGroups.sort((a, b) => a.score - b.score);

    if (eligibleGroups.length > 0) {
        const targetGroup = eligibleGroups[0];
        targetGroup.items.push(item);
        targetGroup.score += item.weight;
    }
}

// 6. Output results
groups.sort((a, b) => a.score - b.score);

for (const g of groups) {
    const itemNames = g.items.map(t => `${t.name} (${t.rarity})`).join(", ");
    output.push(`Group ${g.name} (Score: ${g.score}): ${itemNames}`);
}

output.push(`\nTotal items used: ${itemsToDistribute.length} from pool of ${supplyDeck.length}`);
const remaining = supplyDeck.slice(78).map(t => t.name).join(", ");
output.push(`Leftover items (unused): ${remaining}`);

fs.writeFileSync("ranked_groups.txt", output.join("\n"));
console.log("Saved finite balanced groups to ranked_groups.txt");
