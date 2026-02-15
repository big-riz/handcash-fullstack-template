
import "dotenv/config";
import { getMinter, resolveHandlesToUserIds } from "../lib/items-client";
import { getTemplateById } from "../lib/item-templates-storage";

async function mintItem() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log("Usage: npx tsx scripts/mint-item.ts <templateId> <handle>");
        console.log("Example: npx tsx scripts/mint-item.ts tt33 'user_handle'");
        process.exit(1);
    }

    const templateId = args[0];
    const handleInput = args[1];

    console.log(`🔨 preparing to mint template '${templateId}' to '${handleInput}'...`);

    try {
        // 1. Validate Template
        const template = await getTemplateById(templateId);
        if (!template) {
            console.error(`❌ Template '${templateId}' not found.`);
            process.exit(1);
        }
        console.log(`✅ Found template: ${template.name} (${template.rarity})`);

        // 2. Resolve User Handle
        const authToken = process.env.BUSINESS_AUTH_TOKEN;
        if (!authToken) {
            console.error("❌ BUSINESS_AUTH_TOKEN is not set in .env.local");
            process.exit(1);
        }

        const handles = [handleInput];
        const userMap = await resolveHandlesToUserIds(handles, authToken);
        const userId = userMap[handleInput.toLowerCase()];

        if (!userId && !/^[a-f0-9]{24,}$/i.test(handleInput)) {
            console.error(`❌ Could not resolve handle '${handleInput}' to a user ID.`);
            process.exit(1);
        }

        const finalUserId = userId || handleInput;
        console.log(`✅ Resolved user ID: ${finalUserId}`);

        // 3. Prepare Item Data
        const attributes = (template.attributes || []).map(attr => ({
            name: attr.name,
            value: attr.value,
            displayType: attr.displayType || "string"
        }));

        // Add Template ID as attribute
        attributes.push({
            name: "Template ID",
            value: template.id,
            displayType: "string"
        });

        const itemData = {
            user: finalUserId,
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

        // 4. Mint
        const minter = getMinter();
        console.log("🚀 Sending mint request...");

        const order = await minter.createItemsOrder({
            collectionId: template.collectionId,
            items: [itemData]
        });

        console.log("✅ Mint order created!");
        console.log(`📦 Order ID: ${order.id}`);
        console.log(`🔗 Transaction ID: ${order.transactionId}`);

        console.log(`✨ Successfully minted ${template.name} to ${handleInput}`);

    } catch (error: any) {
        console.error("❌ Minting failed:", error.message || error);
        process.exit(1);
    }
}

mintItem();
