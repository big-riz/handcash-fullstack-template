import { db } from "./db"
import { collections } from "./schema"
import { eq } from "drizzle-orm"

interface Collection {
  id: string
  name: string
  description?: string
  imageUrl?: string
  createdAt: string
  updatedAt?: string
}

export async function saveCollection(collection: Collection): Promise<void> {
  try {
    // Check if collection with this ID already exists
    const existing = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collection.id))
      .limit(1)

    if (existing.length > 0) {
      // Update existing collection
      await db
        .update(collections)
        .set({
          name: collection.name,
          description: collection.description,
          imageUrl: collection.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, collection.id))
    } else {
      // Add new collection
      await db.insert(collections).values({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        imageUrl: collection.imageUrl,
        createdAt: collection.createdAt ? new Date(collection.createdAt) : new Date(),
      })
    }
  } catch (error) {
    console.error("[CollectionsStorage] Error saving collection:", error)
    throw error
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const results = await db.select().from(collections)

    return results.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      imageUrl: c.imageUrl || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
    }))
  } catch (error) {
    console.error("[CollectionsStorage] Error reading collections:", error)
    return []
  }
}

export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    await db.delete(collections).where(eq(collections.id, collectionId))
  } catch (error) {
    console.error("[CollectionsStorage] Error deleting collection:", error)
    throw error
  }
}




