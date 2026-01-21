import { db } from "./db"
import { itemTemplates } from "./schema"
import { eq } from "drizzle-orm"

export interface ItemTemplate {
  id: string
  name: string
  description?: string
  imageUrl?: string
  multimediaUrl?: string
  collectionId: string
  attributes?: Array<{
    name: string
    value: string | number
    displayType?: "string" | "number"
  }>
  rarity?: string
  color?: string
  pool?: string
  spawnWeight?: number
  createdAt?: string
  updatedAt?: string
}

export async function saveTemplate(template: ItemTemplate): Promise<void> {
  try {
    // Check if template with this ID already exists
    const existing = await db
      .select()
      .from(itemTemplates)
      .where(eq(itemTemplates.id, template.id))
      .limit(1)

    if (existing.length > 0) {
      // Update existing template
      await db
        .update(itemTemplates)
        .set({
          name: template.name,
          description: template.description,
          imageUrl: template.imageUrl,
          multimediaUrl: template.multimediaUrl,
          collectionId: template.collectionId,
          attributes: template.attributes,
          rarity: template.rarity,
          color: template.color,
          pool: template.pool || "default",
          spawnWeight: template.spawnWeight || 1,
          updatedAt: new Date(),
        })
        .where(eq(itemTemplates.id, template.id))
    } else {
      // Add new template
      await db.insert(itemTemplates).values({
        id: template.id,
        name: template.name,
        description: template.description,
        imageUrl: template.imageUrl,
        multimediaUrl: template.multimediaUrl,
        collectionId: template.collectionId,
        attributes: template.attributes,
        rarity: template.rarity,
        color: template.color,
        pool: template.pool || "default",
        spawnWeight: template.spawnWeight || 1,
        createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
      })
    }
  } catch (error) {
    console.error("[ItemTemplatesStorage] Error saving template:", error)
    throw error
  }
}

export async function getTemplates(): Promise<ItemTemplate[]> {
  try {
    const results = await db.select().from(itemTemplates)

    return results.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      imageUrl: t.imageUrl || undefined,
      multimediaUrl: t.multimediaUrl || undefined,
      collectionId: t.collectionId!,
      attributes: t.attributes as ItemTemplate["attributes"],
      rarity: t.rarity || undefined,
      color: t.color || undefined,
      pool: t.pool || undefined,
      spawnWeight: t.spawnWeight || undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt?.toISOString(),
    }))
  } catch (error) {
    console.error("[ItemTemplatesStorage] Error reading templates:", error)
    return []
  }
}

export async function getTemplateById(id: string): Promise<ItemTemplate | null> {
  try {
    const results = await db
      .select()
      .from(itemTemplates)
      .where(eq(itemTemplates.id, id))
      .limit(1)

    if (results.length === 0) return null

    const t = results[0]
    return {
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      imageUrl: t.imageUrl || undefined,
      multimediaUrl: t.multimediaUrl || undefined,
      collectionId: t.collectionId!,
      attributes: t.attributes as ItemTemplate["attributes"],
      rarity: t.rarity || undefined,
      color: t.color || undefined,
      pool: t.pool || undefined,
      spawnWeight: t.spawnWeight || undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt?.toISOString(),
    }
  } catch (error) {
    console.error("[ItemTemplatesStorage] Error getting template by ID:", error)
    return null
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await db.delete(itemTemplates).where(eq(itemTemplates.id, templateId))
  } catch (error) {
    console.error("[ItemTemplatesStorage] Error deleting template:", error)
    throw error
  }
}


