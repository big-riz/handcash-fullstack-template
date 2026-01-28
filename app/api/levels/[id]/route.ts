import { NextResponse } from 'next/server'
import { getLevel, deleteLevel } from '../storage'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Only allow on localhost
    const host = request.headers.get('host') || ''
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json({ error: 'Not available' }, { status: 403 })
    }

    const level = getLevel(params.id)

    if (!level) {
        return NextResponse.json({ error: 'Level not found' }, { status: 404 })
    }

    return NextResponse.json({ level })
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Only allow on localhost
    const host = request.headers.get('host') || ''
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json({ error: 'Not available' }, { status: 403 })
    }

    deleteLevel(params.id)

    console.log(`[LevelAPI] Deleted level: ${params.id}`)

    return NextResponse.json({ success: true })
}
