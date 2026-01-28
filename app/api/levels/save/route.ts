import { NextResponse } from 'next/server'
import { saveLevel } from '../storage'

export async function POST(request: Request) {
    // Only allow on localhost
    const host = request.headers.get('host') || ''
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json({ error: 'Not available' }, { status: 403 })
    }

    try {
        const level = await request.json()

        // Validate basic structure
        if (!level.id || !level.name) {
            return NextResponse.json({ error: 'Invalid level data' }, { status: 400 })
        }

        // Save level to shared storage
        const savedLevel = saveLevel(level)

        console.log(`[LevelAPI] Saved level: ${level.id} (${level.name})`)

        return NextResponse.json({ success: true, level: savedLevel })
    } catch (error) {
        console.error('[LevelAPI] Save error:', error)
        return NextResponse.json({ error: 'Failed to save level' }, { status: 500 })
    }
}
