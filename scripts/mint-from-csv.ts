
import "dotenv/config";
import { getMinter, resolveHandlesToUserIds } from "../lib/items-client";
import { getTemplates } from "../lib/item-templates-storage";
import * as fs from "fs";
import * as readline from "readline";

async function mintFromCSV() {
    const csvPath = process.argv[2] || "group_assignments.csv";

    console.log(`🔨 Starting bulk mint from ${csvPath}...\n`);

    try {
        // 1. Load all templates
        const templates = await getTemplates();
        const templateMap = new Map();
        templates.forEach(t => {
            templateMap.set(t.name, t);
        });
        console.log(`✅ Loaded ${templates.length} templates\n`);

        // 2. Parse CSV
        const fileStream = fs.createReadStream(csvPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const assignments: Array<{
            player: string;
            items: string[];
        }> = [];

        let isHeader = true;
        for await (const line of rl) {
            if (!line.trim()) continue;

            const parts = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current.trim());

            if (isHeader) {
                isHeader = false;
                continue;
            }

            const player = parts[0];
            const item1 = parts[3]?.replace(/^"|"$/g, '').replace(/ \(.*?\)$/, '');
            const item2 = parts[4]?.replace(/^"|"$/g, '').replace(/ \(.*?\)$/, '');
            const item3 = parts[5]?.replace(/^"|"$/g, '').replace(/ \(.*?\)$/, '');

            assignments.push({
                player,
                items: [item1, item2, item3].filter(Boolean)
            });
        }

        console.log(`✅ Parsed ${assignments.length} player assignments\n`);

        // 3. Resolve all handles
        const authToken = process.env.BUSINESS_AUTH_TOKEN;
        if (!authToken) {
            console.error("❌ BUSINESS_AUTH_TOKEN is not set in .env.local");
            process.exit(1);
        }

        const allHandles = assignments.map(a => a.player);
        console.log("🔍 Resolving player handles...");
        const userMap = await resolveHandlesToUserIds(allHandles, authToken);
        console.log(`✅ Resolved ${Object.keys(userMap).length} handles\n`);

        // 4. Mint items
        const minter = getMinter();
        let totalMinted = 0;
        let errors = 0;

        for (const assignment of assignments) {
            const userId = userMap[assignment.player.toLowerCase()];
            if (!userId) {
                console.error(`❌ Could not resolve handle: ${assignment.player}`);
                errors++;
                continue;
            }

            console.log(`\n🎯 Minting for ${assignment.player} (${userId}):`);

            for (const itemName of assignment.items) {
                const template = templateMap.get(itemName);
                if (!template) {
                    console.error(`  ❌ Template not found: ${itemName}`);
                    errors++;
                    continue;
                }

                try {
                    const attributes = (template.attributes || []).map(attr => ({
                        name: attr.name,
                        value: attr.value,
                        displayType: attr.displayType || "string"
                    }));

                    attributes.push({
                        name: "Template ID",
                        value: template.id,
                        displayType: "string"
                    });

                    const itemData = {
                        user: userId,
                        name: template.name,
                        rarity: template.rarity || "Common",
                        quantity: 1,
                        attributes: attributes,
                        mediaDetails: {
                            image: template.imageUrl ? {
                                url: template.imageUrl,
                                contentType: "image/png"
                            } : undefined,
                            multimedia: template.multimediaUrl ? {
                                url: template.multimediaUrl,
                                contentType: "application/glb"
                            } : undefined
                        },
                        description: template.description,
                        color: template.color
                    };

                    const order = await minter.createItemsOrder({
                        collectionId: template.collectionId,
                        items: [itemData]
                    });

                    console.log(`  ✅ ${itemName} (Order: ${order.id})`);
                    totalMinted++;

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error: any) {
                    console.error(`  ❌ Failed to mint ${itemName}: ${error.message}`);
                    errors++;
                }
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log(`✨ Minting Complete!`);
        console.log(`✅ Successfully minted: ${totalMinted} items`);
        console.log(`❌ Errors: ${errors}`);
        console.log("=".repeat(50));

    } catch (error: any) {
        console.error("❌ Fatal error:", error.message || error);
        process.exit(1);
    }
}

mintFromCSV();
