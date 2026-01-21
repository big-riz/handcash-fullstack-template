# Item Templates and Minted Items Relationship

## Overview

The database has a proper relational structure between `item_templates` and `minted_items` tables, allowing you to track which template was used to mint each item.

## Database Schema

### Foreign Key Relationship

```typescript
// mintedItems table has a foreign key to itemTemplates
templateId: text("template_id").references(() => itemTemplates.id)
```

### Drizzle ORM Relations

The schema now includes Drizzle relations for easier querying:

```typescript
// Item Templates can have many Minted Items
export const itemTemplatesRelations = relations(itemTemplates, ({ one, many }) => ({
    collection: one(collections, {
        fields: [itemTemplates.collectionId],
        references: [collections.id],
    }),
    mintedItems: many(mintedItems),
}))

// Minted Items belong to one Template
export const mintedItemsRelations = relations(mintedItems, ({ one }) => ({
    template: one(itemTemplates, {
        fields: [mintedItems.templateId],
        references: [itemTemplates.id],
    }),
    collection: one(collections),
    payment: one(payments),
}))
```

## Available Query Functions

### 1. Get Minted Items with Template Data

```typescript
import { getMintedItemsWithTemplate } from "@/lib/minted-items-storage"

// Get all minted items with their template info
const allItems = await getMintedItemsWithTemplate()

// Get minted items for a specific user with template info
const userItems = await getMintedItemsWithTemplate("userId123")

// Result structure:
// [
//   {
//     mintedItem: { id, origin, itemName, ... },
//     template: { id, name, description, multimediaUrl, ... }
//   }
// ]
```

### 2. Get Template Usage Statistics

```typescript
import { getTemplateUsageStats } from "@/lib/minted-items-storage"

const stats = await getTemplateUsageStats()

// Result:
// [
//   { templateId: "kv2-tank-model-template", templateName: "KV-2 Tank Model", mintCount: 15 },
//   { templateId: "gold-chain-template", templateName: "Gold Chain", mintCount: 8 },
//   ...
// ]
```

### 3. Get All Minted Items for a Specific Template

```typescript
import { getMintedItemsByTemplateId } from "@/lib/minted-items-storage"

const tankItems = await getMintedItemsByTemplateId("kv2-tank-model-template")

// Returns all minted items that were created from this template
```

## How It Works

### When Minting

1. **Template Selection**: The mint API selects a random template from the database based on spawn weights
2. **Template ID Storage**: When recording the minted item, the `templateId` is saved:

```typescript
await recordMintedItem({
    id: mintedItem.id,
    origin: mintedItem.origin,
    templateId: randomItem.id, // ← Template ID is stored here
    itemName: mintedItem.name,
    imageUrl: mintedItem.imageUrl,
    multimediaUrl: mintedItem.multimediaUrl,
    // ... other fields
})
```

3. **Relationship Established**: The foreign key creates a permanent link between the minted item and its template

### Benefits

1. **Track Template Usage**: See which templates are most popular
2. **Maintain Template Data**: Even if a minted item's properties change, you can reference the original template
3. **Analytics**: Generate reports on template performance
4. **Bulk Updates**: Update all items from a specific template if needed
5. **Inheritance**: New minted items automatically get the latest template properties (imageUrl, multimediaUrl, etc.)

## Example Use Cases

### Display Template Info on Minted Items

```typescript
const itemsWithTemplates = await getMintedItemsWithTemplate(userId)

itemsWithTemplates.forEach(({ mintedItem, template }) => {
    console.log(`Item: ${mintedItem.itemName}`)
    console.log(`From Template: ${template?.name}`)
    console.log(`Template Description: ${template?.description}`)
})
```

### Admin Dashboard - Template Performance

```typescript
const stats = await getTemplateUsageStats()

// Show which templates are being minted most
stats.forEach(({ templateName, mintCount }) => {
    console.log(`${templateName}: ${mintCount} mints`)
})
```

### Find All Instances of a Specific Item

```typescript
// Find all KV-2 Tanks that have been minted
const allTanks = await getMintedItemsByTemplateId("kv2-tank-model-template")

console.log(`Total KV-2 Tanks minted: ${allTanks.length}`)
allTanks.forEach(tank => {
    console.log(`- Minted to: ${tank.mintedToHandle} at ${tank.mintedAt}`)
})
```

## Database Migration

If you need to run migrations to ensure the relationship is properly set up:

```bash
npm run db:generate  # Generate migration files
npm run db:push      # Apply to database
```

## Notes

- The `templateId` field is **optional** to support items minted without templates (legacy or special items)
- Templates can be deleted without affecting minted items (no cascade delete)
- The relationship is **one-to-many**: one template can have many minted items
- Minted items are **immutable snapshots** - they capture the template's properties at mint time
