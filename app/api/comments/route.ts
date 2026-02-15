import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { comments } from "@/lib/schema"
import { desc } from "drizzle-orm"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"
import { checkCollectionAccess } from "@/lib/access-check"

export async function GET() {
    try {
        const result = await db.select().from(comments).orderBy(desc(comments.createdAt)).limit(50)
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req)
        if (!authResult.success) {
            return authResult.response
        }

        const { privateKey } = authResult

        // Check if user has required collection item (broad access to any of our collections)
        const accessResult = await checkCollectionAccess(privateKey)
        if (!accessResult.authorized) {
            return NextResponse.json(
                { error: accessResult.reason || "Missing required collection item to post comments" },
                { status: 403 }
            )
        }


        const profile = await handcashService.getUserProfile(privateKey)
        if (!profile || !profile.publicProfile) {
            return NextResponse.json({ error: "Could not determined identity" }, { status: 400 })
        }

        const userId = (profile as any).id || profile.publicProfile.id || profile.publicProfile.handle

        const { content, parentId } = await req.json()
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
        }

        const newComment = await db.insert(comments).values({
            userId,
            handle: profile.publicProfile.handle,
            avatarUrl: profile.publicProfile.avatarUrl,
            content: content.trim(),
            parentId: parentId || null,
        }).returning()


        return NextResponse.json(newComment[0])
    } catch (error: any) {
        console.error("Failed to post comment:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
