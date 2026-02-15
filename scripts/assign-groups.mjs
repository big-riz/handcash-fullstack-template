
import * as fs from "fs";

// Seeded PRNG Implementation (cyrb128 + sfc32)
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21) | (c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

// 1. Initialize Random Generator with the User's Seed Phrase
const seedPhrase = "cyka blyat where is my eastern treasure!??!?!?!?! PRIVET!!!!!!!!!!!!!!";
const seed = cyrb128(seedPhrase);
const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

// 2. Load Players and Filter Exclusions
const allPlayers = JSON.parse(fs.readFileSync("unique-handles.json", "utf-8"));
const exclusions = ["lexssit", "metadesk", "bigriz", "brandonc"];

const eligiblePlayers = allPlayers.filter(p => !exclusions.includes(p.toLowerCase()));

console.log(`Found ${eligiblePlayers.length} eligible players out of ${allPlayers.length} total.`);

// 3. Load Groups from ranked_groups.txt
const loadedGroupsText = fs.readFileSync("ranked_groups.txt", "utf-8");
const groups = [];
const lines = loadedGroupsText.split("\n");

for (const line of lines) {
    // Parse lines like "Group A (Score: 17): Item1, Item2, Item3"
    const match = line.match(/^Group ([A-Z]) \(Score: (\d+)\): (.+)$/);
    if (match) {
        groups.push({
            name: match[1],
            score: parseInt(match[2]),
            items: match[3]
        });
    }
}

console.log(`Loaded ${groups.length} groups.`);

// 4. Shuffle Players Deterministically
// Fisher-Yates with seeded random
for (let i = eligiblePlayers.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [eligiblePlayers[i], eligiblePlayers[j]] = [eligiblePlayers[j], eligiblePlayers[i]];
}

// 5. Assign Groups
// Since groups are ranked/balanced, just assigning sequentially after shuffling players is random.
// Or we can shuffle groups too. But usually assigning random player to ordered slot (Group A) is effectively random assignment.
// We assign Group A to Player 1, Group B to Player 2...
// Note: We have 26 groups and 24 players. 2 groups will be unassigned.

const assignments = [];
assignments.push("--------------------------------------------------");
assignments.push(`GROUP ASSIGNMENTS (Seed: "${seedPhrase}")`);
assignments.push("--------------------------------------------------\n");

for (let i = 0; i < eligiblePlayers.length; i++) {
    const player = eligiblePlayers[i];
    const group = groups[i]; // Group A, B, C... logic assumes groups array is ordered A-Z or by rank.
    // ranked_groups.txt is usually sorted by rank (Score 15 -> 17).
    // The previous script sorted them by Score.
    // So the FIRST players (randomly picked) get the BEST groups (Score 15).
    // This is fair because players are shuffled randomly.

    assignments.push(`PLAYER: ${player.padEnd(20)} -> GROUP ${group.name} (Score: ${group.score})`);
    assignments.push(`   Items: ${group.items}\n`);
}

assignments.push("--------------------------------------------------");
if (groups.length > eligiblePlayers.length) {
    assignments.push(`Unassigned Groups: ${groups.slice(eligiblePlayers.length).map(g => g.name).join(", ")}`);
}

fs.writeFileSync("group_assignments.txt", assignments.join("\n"));
console.log("Assignments saved to group_assignments.txt");
