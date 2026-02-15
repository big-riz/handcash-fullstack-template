import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { checkCollectionAccess } from "@/lib/access-check"

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
        return NextResponse.json({ success: false, authorized: false, reason: "Unauthorized" })
    }

    const { privateKey } = authResult

    const accessResult = await checkCollectionAccess(privateKey)

    if (!accessResult.success) {
        return NextResponse.json({
            success: false,
            authorized: false,
            error: accessResult.reason,
            details: accessResult.error
        }, { status: 500 })
    }

    return NextResponse.json(accessResult)
}
