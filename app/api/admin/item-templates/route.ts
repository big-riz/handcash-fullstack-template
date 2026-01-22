import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-middleware"
import { getTemplates, saveTemplate, deleteTemplate, archiveTemplate, unarchiveTemplate } from "@/lib/item-templates-storage"
import { randomUUID } from "crypto"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult.response
  }

  try {
    const templates = await getTemplates()
    return NextResponse.json({ success: true, templates })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Item templates GET error:", error)
    return NextResponse.json({ error: "Failed to fetch templates", details: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult.response
  }

  try {
    const body = await request.json()
    const { name, description, imageUrl, multimediaUrl, collectionId, attributes, rarity, color, pool, supplyLimit } = body

    if (!name || !collectionId) {
      return NextResponse.json({ error: "Missing required fields: name and collectionId are required" }, { status: 400 })
    }

    if (!imageUrl && !multimediaUrl) {
      return NextResponse.json(
        { error: "Missing required fields: either imageUrl or multimediaUrl is required" },
        { status: 400 },
      )
    }

    const templateId = randomUUID()

    const template = {
      id: templateId,
      name,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      multimediaUrl: multimediaUrl || undefined,
      collectionId,
      attributes: attributes || [],
      rarity: rarity || "Common",
      color: color || undefined,
      pool: pool || "default",
      supplyLimit: typeof supplyLimit === "number" ? supplyLimit : 0,
      createdAt: new Date().toISOString(),
    }

    await saveTemplate(template)

    return NextResponse.json({ success: true, template })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Create template error:", error)
    return NextResponse.json({ error: "Failed to create template", details: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult.response
  }

  try {
    const body = await request.json()
    const { id, name, description, imageUrl, multimediaUrl, collectionId, attributes, rarity, color, pool, supplyLimit } = body

    if (!id || !name || !collectionId) {
      return NextResponse.json({ error: "Missing required fields: id, name and collectionId are required" }, { status: 400 })
    }

    if (!imageUrl && !multimediaUrl) {
      return NextResponse.json(
        { error: "Missing required fields: either imageUrl or multimediaUrl is required" },
        { status: 400 },
      )
    }

    const template = {
      id,
      name,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      multimediaUrl: multimediaUrl || undefined,
      collectionId,
      attributes: attributes || [],
      rarity: rarity || "Common",
      color: color || undefined,
      pool: pool || "default",
      supplyLimit: typeof supplyLimit === "number" ? supplyLimit : 0,
    }

    await saveTemplate(template)

    return NextResponse.json({ success: true, template })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Update template error:", error)
    return NextResponse.json({ error: "Failed to update template", details: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    await deleteTemplate(templateId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Delete template error:", error)
    return NextResponse.json({ error: "Failed to delete template", details: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")
    const action = searchParams.get("action")

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    if (!action || (action !== "archive" && action !== "unarchive")) {
      return NextResponse.json({ error: "Action must be 'archive' or 'unarchive'" }, { status: 400 })
    }

    if (action === "archive") {
      await archiveTemplate(templateId)
    } else {
      await unarchiveTemplate(templateId)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Archive/unarchive template error:", error)
    return NextResponse.json({ error: "Failed to update template", details: message }, { status: 500 })
  }
}

