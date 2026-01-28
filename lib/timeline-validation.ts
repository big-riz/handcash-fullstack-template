/**
 * Timeline Validation and Automation
 *
 * Provides comprehensive validation, automation commands, and batch operations
 * for spawn event timelines. All timeline modifications route through this system
 * to ensure consistency, validation, and auditability.
 */

export interface TimelineEvent {
    time: number
    enemyType: string
    count: number
    isElite: boolean
    isBoss: boolean
    message?: string
}

// Valid enemy types from enemies.ts
export const VALID_ENEMY_TYPES = new Set([
    'drifter', 'screecher', 'bruiser', 'zmora', 'kikimora', 'domovoi',
    'werewolf', 'spirit_wolf', 'forest_wraith', 'stone_golem', 'guardian_golem',
    'ancient_treant', 'leshy', 'leshy_shaman', 'sapling', 'blizzard_wolf',
    'bone_crawler', 'crypt_guardian', 'flame_wraith', 'frost_bat', 'frost_elemental',
    'golem_destroyer', 'ice_golem', 'shadow_stalker', 'snow_wraith', 'tox_shroom',
    'vodnik', 'wasp_swarm', 'chernobog'
])

export const VALID_ENEMY_TYPES_ARRAY = Array.from(VALID_ENEMY_TYPES).sort()

export interface ValidationError {
    index?: number
    field: string
    value: any
    message: string
    severity: 'error' | 'warning'
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
}

/**
 * Validate a single timeline event
 */
export function validateTimelineEvent(
    event: TimelineEvent,
    index?: number
): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Validate time
    if (typeof event.time !== 'number' || event.time < 0) {
        errors.push({
            index,
            field: 'time',
            value: event.time,
            message: 'Time must be a non-negative number',
            severity: 'error'
        })
    }

    // Validate count
    if (typeof event.count !== 'number' || event.count < 1 || !Number.isInteger(event.count)) {
        errors.push({
            index,
            field: 'count',
            value: event.count,
            message: 'Count must be a positive integer',
            severity: 'error'
        })
    }

    if (event.count > 100) {
        warnings.push({
            index,
            field: 'count',
            value: event.count,
            message: 'Count > 100 may cause performance issues',
            severity: 'warning'
        })
    }

    // Validate enemy type
    if (!VALID_ENEMY_TYPES.has(event.enemyType)) {
        errors.push({
            index,
            field: 'enemyType',
            value: event.enemyType,
            message: `Unknown enemy type: "${event.enemyType}"`,
            severity: 'error'
        })
    }

    // Validate flags
    if (typeof event.isElite !== 'boolean') {
        errors.push({
            index,
            field: 'isElite',
            value: event.isElite,
            message: 'isElite must be boolean',
            severity: 'error'
        })
    }

    if (typeof event.isBoss !== 'boolean') {
        errors.push({
            index,
            field: 'isBoss',
            value: event.isBoss,
            message: 'isBoss must be boolean',
            severity: 'error'
        })
    }

    // Validate message (optional)
    if (event.message !== undefined && typeof event.message !== 'string') {
        errors.push({
            index,
            field: 'message',
            value: event.message,
            message: 'Message must be a string or undefined',
            severity: 'error'
        })
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Validate entire timeline
 */
export function validateTimeline(timeline: TimelineEvent[]): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationError[] = []
    let lastTime = -1

    timeline.forEach((event, index) => {
        const result = validateTimelineEvent(event, index)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)

        // Check ordering
        if (event.time < lastTime) {
            allErrors.push({
                index,
                field: 'time',
                value: event.time,
                message: `Events not sorted: event ${index} (${event.time}s) comes after event ${index - 1} (${lastTime}s)`,
                severity: 'error'
            })
        }

        // Check for duplicate times (warning)
        if (event.time === lastTime && index > 0) {
            allWarnings.push({
                index,
                field: 'time',
                value: event.time,
                message: `Same spawn time as previous event`,
                severity: 'warning'
            })
        }

        lastTime = event.time
    })

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    }
}

/**
 * Auto-fix common timeline issues
 */
export function autoFixTimeline(timeline: TimelineEvent[]): TimelineEvent[] {
    return timeline
        .map(event => ({
            ...event,
            count: Math.max(1, Math.floor(event.count)),
            time: Math.max(0, event.time),
            isElite: Boolean(event.isElite),
            isBoss: Boolean(event.isBoss),
            message: event.message || ''
        }))
        .sort((a, b) => a.time - b.time)
}

/**
 * Batch update timeline events
 * Supports partial updates to multiple events by index
 */
export function batchUpdateTimeline(
    timeline: TimelineEvent[],
    updates: Array<{ index: number; changes: Partial<TimelineEvent> }>
): TimelineEvent[] {
    const result = timeline.map(e => ({ ...e }))

    for (const { index, changes } of updates) {
        if (index < 0 || index >= result.length) {
            console.warn(`Batch update: index ${index} out of bounds`)
            continue
        }
        result[index] = { ...result[index], ...changes }
    }

    return result.sort((a, b) => a.time - b.time)
}

/**
 * Shift all events after a given time by a delta
 */
export function shiftEventsAfterTime(
    timeline: TimelineEvent[],
    afterTime: number,
    delta: number
): TimelineEvent[] {
    return timeline.map(event =>
        event.time > afterTime ? { ...event, time: event.time + delta } : event
    )
}

/**
 * Remove all events in a time range (inclusive)
 */
export function removeEventsInRange(
    timeline: TimelineEvent[],
    startTime: number,
    endTime: number
): TimelineEvent[] {
    return timeline.filter(event => event.time < startTime || event.time > endTime)
}

/**
 * Duplicate event(s) with time offset
 */
export function duplicateEvents(
    timeline: TimelineEvent[],
    indices: number[],
    timeOffset: number = 5
): TimelineEvent[] {
    const duplicated = indices
        .filter(i => i >= 0 && i < timeline.length)
        .map(i => ({ ...timeline[i], time: timeline[i].time + timeOffset }))

    return [...timeline, ...duplicated].sort((a, b) => a.time - b.time)
}

/**
 * Compress timeline: reduce time values by a factor while maintaining gaps
 */
export function compressTimeline(
    timeline: TimelineEvent[],
    compressionFactor: number = 0.5
): TimelineEvent[] {
    return timeline.map(event => ({
        ...event,
        time: event.time * compressionFactor
    }))
}

/**
 * Export timeline as CSV for external tools
 */
export function timelineToCSV(timeline: TimelineEvent[]): string {
    const header = 'time,enemyType,count,isElite,isBoss,message'
    const rows = timeline.map(e =>
        `${e.time},"${e.enemyType}",${e.count},${e.isElite},${e.isBoss},"${e.message || ''}"`
    )
    return [header, ...rows].join('\n')
}

/**
 * Import timeline from CSV
 */
export function timelineFromCSV(csv: string): TimelineEvent[] {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []

    const events: TimelineEvent[] = []
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        if (parts.length < 5) continue

        const event: TimelineEvent = {
            time: parseFloat(parts[0]),
            enemyType: parts[1].replace(/"/g, ''),
            count: parseInt(parts[2]),
            isElite: parts[3] === 'true',
            isBoss: parts[4] === 'true',
            message: parts[5]?.replace(/"/g, '') || ''
        }

        const validation = validateTimelineEvent(event)
        if (validation.isValid) {
            events.push(event)
        }
    }

    return events.sort((a, b) => a.time - b.time)
}

/**
 * Generate statistics about timeline
 */
export function getTimelineStats(timeline: TimelineEvent[]) {
    const stats = {
        eventCount: timeline.length,
        totalTime: timeline.length > 0 ? Math.max(...timeline.map(e => e.time)) : 0,
        totalEnemies: timeline.reduce((sum, e) => sum + e.count, 0),
        eliteCount: timeline.filter(e => e.isElite).length,
        bossCount: timeline.filter(e => e.isBoss).length,
        uniqueEnemyTypes: new Set(timeline.map(e => e.enemyType)).size,
        enemyTypeDistribution: Object.fromEntries(
            Array.from(
                timeline.reduce((map, e) => {
                    map.set(e.enemyType, (map.get(e.enemyType) || 0) + e.count)
                    return map
                }, new Map<string, number>()).entries()
            )
        )
    }
    return stats
}

/**
 * Detect gaps in the timeline where no events occur for an extended period
 */
export function detectTimelineGaps(timeline: TimelineEvent[], minGapSeconds: number = 30): Array<{ start: number; end: number; duration: number }> {
    if (timeline.length < 2) return []
    const sorted = [...timeline].sort((a, b) => a.time - b.time)
    const gaps: Array<{ start: number; end: number; duration: number }> = []
    for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].time - sorted[i - 1].time
        if (gap >= minGapSeconds) {
            gaps.push({ start: sorted[i - 1].time, end: sorted[i].time, duration: gap })
        }
    }
    return gaps
}

/**
 * Generate a density histogram for the timeline
 * Returns an array of bucket counts over fixed intervals
 */
export function getTimelineDensity(timeline: TimelineEvent[], bucketCount: number = 20): Array<{ time: number; enemyCount: number; eventCount: number }> {
    if (timeline.length === 0) return []
    const maxTime = Math.max(...timeline.map(e => e.time))
    if (maxTime <= 0) return [{ time: 0, enemyCount: timeline.reduce((s, e) => s + e.count, 0), eventCount: timeline.length }]
    const bucketSize = maxTime / bucketCount
    const buckets: Array<{ time: number; enemyCount: number; eventCount: number }> = []
    for (let i = 0; i < bucketCount; i++) {
        buckets.push({ time: i * bucketSize, enemyCount: 0, eventCount: 0 })
    }
    for (const event of timeline) {
        const idx = Math.min(Math.floor(event.time / bucketSize), bucketCount - 1)
        buckets[idx].enemyCount += event.count
        buckets[idx].eventCount += 1
    }
    return buckets
}
