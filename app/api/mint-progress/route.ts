import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mintedItems, itemTemplates } from '@/lib/schema'
import { eq, sql, and, or, isNull, inArray } from 'drizzle-orm'
import { getCached, setCache } from '@/lib/cache'

const templateColumns = {
    id: itemTemplates.id,
    name: itemTemplates.name,
    rarity: itemTemplates.rarity,
    imageUrl: itemTemplates.imageUrl,
    pool: itemTemplates.pool,
    supplyLimit: itemTemplates.supplyLimit,
    isArchived: itemTemplates.isArchived,
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const templateId = searchParams.get('templateId')
        const pool = searchParams.get('pool')

        if (templateId) {
            const cacheKey = `mint-progress:${templateId}`
            const cached = getCached<any>(cacheKey)
            if (cached) return NextResponse.json(cached)

            // Get progress for a specific template
            const [template] = await db
                .select(templateColumns)
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
                .where(and(
                    eq(mintedItems.templateId, templateId),
                    eq(mintedItems.isArchived, false)
                ))

            const response = {
                templateId: template.id,
                minted: result?.count || 0,
                supplyLimit: template.supplyLimit || 0,
                lastUpdate: Date.now()
            }
            setCache(cacheKey, response, 30_000)
            return NextResponse.json(response)
        }

        if (pool) {
            const poolCacheKey = `mint-progress:pool:${pool}`
            const cached = getCached<any>(poolCacheKey)
            if (cached) return NextResponse.json(cached)

            // Get progress for all templates in a pool (excluding archived)
            const templates = await db
                .select(templateColumns)
                .from(itemTemplates)
                .where(
                    and(
                        eq(itemTemplates.pool, pool),
                        or(eq(itemTemplates.isArchived, false), isNull(itemTemplates.isArchived))
                    )
                )

            const templateIds = templates.map(t => t.id)
            const mintCountMap = new Map<string, number>()
            if (templateIds.length > 0) {
                const mintCounts = await db
                    .select({
                        templateId: mintedItems.templateId,
                        count: sql<number>`count(*)`.mapWith(Number),
                    })
                    .from(mintedItems)
                    .where(and(
                        eq(mintedItems.isArchived, false),
                        inArray(mintedItems.templateId, templateIds)
                    ))
                    .groupBy(mintedItems.templateId)
                mintCounts.forEach(mc => mintCountMap.set(mc.templateId, mc.count))
            }

            const progress = templates.map(template => ({
                id: template.id,
                templateId: template.id,
                name: template.name,
                rarity: template.rarity,
                imageUrl: template.imageUrl,
                minted: mintCountMap.get(template.id) || 0,
                supplyLimit: template.supplyLimit || 0,
                lastUpdate: Date.now()
            }))

            const poolResponse = { pool, items: progress }
            setCache(poolCacheKey, poolResponse, 30_000)
            return NextResponse.json(poolResponse)
        }

        // Get all progress (excluding archived)
        const allCacheKey = 'mint-progress:all'
        const allCached = getCached<any>(allCacheKey)
        if (allCached) return NextResponse.json(allCached)

        const templates = await db
            .select(templateColumns)
            .from(itemTemplates)
            .where(or(eq(itemTemplates.isArchived, false), isNull(itemTemplates.isArchived)))

        const mintCounts = await db
            .select({
                templateId: mintedItems.templateId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(mintedItems)
            .where(eq(mintedItems.isArchived, false))
            .groupBy(mintedItems.templateId)

        const mintCountMap = new Map(mintCounts.map(mc => [mc.templateId, mc.count]))

        const progress = templates.map(template => ({
            id: template.id,
            templateId: template.id,
            name: template.name,
            rarity: template.rarity,
            imageUrl: template.imageUrl,
            minted: mintCountMap.get(template.id) || 0,
            supplyLimit: template.supplyLimit || 0,
            lastUpdate: Date.now()
        }))

        const allResponse = { items: progress }
        setCache(allCacheKey, allResponse, 30_000)
        return NextResponse.json(allResponse)
    } catch (error: any) {
        console.error('[Mint Progress API] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch mint progress' },
            { status: 500 }
        )
    }
}
