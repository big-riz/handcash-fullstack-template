
import * as fs from "fs";

const inputFile = "group_assignments.txt";
const outputFile = "group_assignments.csv";

const content = fs.readFileSync(inputFile, "utf-8");
const lines = content.split("\n");

// Headers
const csvRows = ["Player,Group,Score,Item 1,Item 2,Item 3"];

let currentPlayer = null;
let currentGroup = null;
let currentScore = null;

for (const line of lines) {
    // Parse Player Line
    // PLAYER: guxiaolei            -> GROUP E (Score: 15)
    const playerMatch = line.match(/^PLAYER: (.+?)\s+-> GROUP ([A-Z]) \(Score: (\d+)\)$/);
    if (playerMatch) {
        currentPlayer = playerMatch[1].trim();
        currentGroup = playerMatch[2];
        currentScore = playerMatch[3];
        continue;
    }

    // Parse Items Line
    //    Items: Doily Bra (Uncommon), Gold Leaf Slipper (Uncommon), Kharkovchanka (Legendary)
    const itemsMatch = line.match(/^\s+Items: (.+)$/);
    if (itemsMatch && currentPlayer) {
        const itemsString = itemsMatch[1];
        // Split by comma, but handle potential commas in names? (No commas in names seen so far)
        // Names format: "Name (Rarity)"
        // Split by "), "
        let items = itemsString.split("), ").map(i => {
            if (!i.endsWith(")")) i += ")";
            return i.trim();
        });

        // Ensure 3 columns
        while (items.length < 3) items.push("");

        // Escape for CSV (wrap in quotes if needed)
        const escapedItems = items.map(i => `"${i}"`);

        csvRows.push(`${currentPlayer},${currentGroup},${currentScore},${escapedItems.join(",")}`);

        // Reset
        currentPlayer = null;
    }
}

fs.writeFileSync(outputFile, csvRows.join("\n"));
console.log(`Saved ${csvRows.length - 1} assignments to ${outputFile}`);
