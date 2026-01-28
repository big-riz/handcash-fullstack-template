/**
 * Timeline Automation API
 *
 * Headless automation endpoint for timeline operations.
 * All operations are deterministic, idempotent, and scriptable.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    validateTimeline,
    autoFixTimeline,
    batchUpdateTimeline,
    shiftEventsAfterTime,
    removeEventsInRange,
    duplicateEvents,
    compressTimeline,
    timelineToCSV,
    timelineFromCSV,
    getTimelineStats,
    type TimelineEvent
} from '@/lib/timeline-validation'

interface TimelineOperationRequest {
    operation: string
    levelId?: string
    data?: any
    params?: any
}

interface TimelineOperationResponse {
    success: boolean
    message?: string
    data?: any
    errors?: string[]
}

/**
 * POST /api/levels/timeline
 *
 * Supported operations:
 * - validate: Check timeline integrity
 * - autofix: Automatically fix common issues
 * - batch-update: Batch modify events
 * - shift: Shift events by time delta
 * - remove-range: Remove events in time range
 * - duplicate: Duplicate specific events
 * - compress: Scale all times
 * - export-csv: Export as CSV
 * - import-csv: Import from CSV
 * - stats: Get timeline statistics
 */
export async function POST(request: NextRequest): Promise<NextResponse<TimelineOperationResponse>> {
    try {
        const body: TimelineOperationRequest = await request.json()
        const { operation, data, params } = body

        switch (operation) {
            case 'validate': {
                const result = validateTimeline(data.timeline || [])
                return NextResponse.json({
                    success: result.isValid,
                    data: result,
                    message: result.isValid ? 'Timeline valid' : 'Timeline has errors'
                })
            }

            case 'autofix': {
                const fixed = autoFixTimeline(data.timeline || [])
                return NextResponse.json({
                    success: true,
                    data: { timeline: fixed },
                    message: 'Timeline auto-fixed'
                })
            }

            case 'batch-update': {
                const updated = batchUpdateTimeline(
                    data.timeline || [],
                    params.updates || []
                )
                const validation = validateTimeline(updated)
                return NextResponse.json({
                    success: validation.isValid,
                    data: { timeline: updated, validation },
                    message: validation.isValid ? 'Batch update successful' : 'Validation errors after update'
                })
            }

            case 'shift': {
                const shifted = shiftEventsAfterTime(
                    data.timeline || [],
                    params.afterTime || 0,
                    params.delta || 0
                )
                return NextResponse.json({
                    success: true,
                    data: { timeline: shifted },
                    message: `Shifted events by ${params.delta}s`
                })
            }

            case 'remove-range': {
                const removed = removeEventsInRange(
                    data.timeline || [],
                    params.startTime || 0,
                    params.endTime || Infinity
                )
                return NextResponse.json({
                    success: true,
                    data: { timeline: removed },
                    message: `Removed ${(data.timeline?.length || 0) - removed.length} events`
                })
            }

            case 'duplicate': {
                const duplicated = duplicateEvents(
                    data.timeline || [],
                    params.indices || [],
                    params.timeOffset || 5
                )
                return NextResponse.json({
                    success: true,
                    data: { timeline: duplicated },
                    message: `Duplicated ${params.indices?.length || 0} events`
                })
            }

            case 'compress': {
                const compressed = compressTimeline(
                    data.timeline || [],
                    params.factor || 0.5
                )
                return NextResponse.json({
                    success: true,
                    data: { timeline: compressed },
                    message: `Compressed timeline by factor ${params.factor}`
                })
            }

            case 'export-csv': {
                const csv = timelineToCSV(data.timeline || [])
                return NextResponse.json({
                    success: true,
                    data: { csv },
                    message: 'Timeline exported to CSV'
                })
            }

            case 'import-csv': {
                const imported = timelineFromCSV(params.csv || '')
                const validation = validateTimeline(imported)
                return NextResponse.json({
                    success: validation.isValid,
                    data: { timeline: imported, validation },
                    message: validation.isValid ? 'CSV imported successfully' : 'Import has validation errors'
                })
            }

            case 'stats': {
                const stats = getTimelineStats(data.timeline || [])
                return NextResponse.json({
                    success: true,
                    data: stats,
                    message: 'Timeline statistics'
                })
            }

            default:
                return NextResponse.json({
                    success: false,
                    message: `Unknown operation: ${operation}`,
                    errors: [
                        'validate', 'autofix', 'batch-update', 'shift',
                        'remove-range', 'duplicate', 'compress',
                        'export-csv', 'import-csv', 'stats'
                    ]
                }, { status: 400 })
        }
    } catch (error) {
        console.error('[Timeline API] Error:', error)
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            errors: [error instanceof Error ? error.message : String(error)]
        }, { status: 500 })
    }
}
