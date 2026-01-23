import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mintedItems, itemTemplates } from '@/lib/schema'
import { eq, sql, and, or, isNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const templateId = searchParams.get('templateId')
        const pool = searchParams.get('pool')

        if (templateId) {
            // Get progress for a specific template
            const [template] = await db
                .select()
                .from(itemTemplates)
                .where(
                    and(
                        eq(itemTemplates.id, templateId),
                        or(eq(itemTemplates.isArchived, false), isNull(itemTemplates.isArchived))
                    )
                )
                .limit(1)

            if (!template) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 })
            }

            const [result] = await db
                .select({
                    count: sql<number>`count(*)`.mapWith(Number)
                })
                .from(mintedItems)
                .where(eq(mintedItems.templateId, templateId))

            return NextResponse.json({
                templateId: template.id,
                minted: result?.count || 0,
                supplyLimit: template.supplyLimit || 0,
                lastUpdate: Date.now()
            })
        }

        if (pool) {
            // Get progress for all templates in a pool (excluding archived)
            const templates = await db
                .select()
                .from(itemTemplates)
                .where(
                    and(
                        eq(itemTemplates.pool, pool),
                        or(eq(itemTemplates.isArchived, false), isNull(itemTemplates.isArchived))
                    )
                )

            const mintCounts = await db
                .select({
                    templateId: mintedItems.templateId,
                    count: sql<number>`count(*)`.mapWith(Number),
                })
                .from(mintedItems)
                .groupBy(mintedItems.templateId)

            const mintCountMap = new Map(mintCounts.map(mc => [mc.templateId, mc.count]))

            const progress = templates.map(template => ({
                id: template.id,
                templateId: template.id,
                name: template.name,
                rarity: template.rarity,
                imageUrl: template.imageUrl,
                multimediaUrl: template.multimediaUrl,
                minted: mintCountMap.get(template.id) || 0,
                supplyLimit: template.supplyLimit || 0,
                lastUpdate: Date.now()
            }))

            return NextResponse.json({ pool, items: progress })
        }

        // Get all progress (excluding archived)
        const templates = await db
            .select()
            .from(itemTemplates)
            .where(or(eq(itemTemplates.isArchived, false), isNull(itemTemplates.isArchived)))

        const mintCounts = await db
            .select({
                templateId: mintedItems.templateId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(mintedItems)
            .groupBy(mintedItems.templateId)

        const mintCountMap = new Map(mintCounts.map(mc => [mc.templateId, mc.count]))

        const progress = templates.map(template => ({
            id: template.id,
            templateId: template.id,
            name: template.name,
            rarity: template.rarity,
            imageUrl: template.imageUrl,
            multimediaUrl: template.multimediaUrl,
            minted: mintCountMap.get(template.id) || 0,
            supplyLimit: template.supplyLimit || 0,
            lastUpdate: Date.now()
        }))

        return NextResponse.json({ items: progress })
    } catch (error: any) {
        console.error('[Mint Progress API] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch mint progress' },
            { status: 500 }
        )
    }
}
