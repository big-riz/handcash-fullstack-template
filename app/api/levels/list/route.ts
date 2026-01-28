import { NextResponse } from 'next/server'
import { getAllLevels } from '../storage'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Only allow on localhost
    const host = request.headers.get('host') || ''
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json({ error: 'Not available' }, { status: 403 })
    }

    return NextResponse.json({ levels: getAllLevels() })
}
