/**
 * Level Automation Module
 *
 * Provides scriptable, idempotent, deterministic automation commands for
 * every editor action. All functions can be called from browser console
 * via window.__levelAutomation or from scripts.
 *
 * Build order: timeline -> meshes -> paint -> settings
 */

import { LEVEL_SCHEMA_VERSION, type CustomLevelData, type MeshPlacement, type PaintedArea, type BorderConfig, type SplinePath } from '@/components/game/debug/LevelEditor'
import type { TimelineEvent } from '@/lib/timeline-validation'
import {
    validateTimeline,
    validateTimelineEvent,
    autoFixTimeline,
    getTimelineStats,
    getTimelineDensity,
    detectTimelineGaps,
    timelineToCSV,
    timelineFromCSV,
    VALID_ENEMY_TYPES,
    VALID_ENEMY_TYPES_ARRAY
} from '@/lib/timeline-validation'
import {
    loadCustomLevels,
    saveCustomLevel,
    deleteCustomLevel,
    clearCustomLevelsCache
} from '@/lib/custom-levels-storage'

// ============================================================
// Schema Migration
// ============================================================

export function migrateLevel(level: any): CustomLevelData {
    const version = level.schemaVersion || 1

    let migrated = { ...level }

    // v1 -> v2: ensure all optional arrays exist, add schemaVersion
    if (version < 2) {
        migrated.meshPlacements = migrated.meshPlacements || []
        migrated.paintedAreas = migrated.paintedAreas || []
        migrated.splinePaths = migrated.splinePaths || []
        migrated.customMeshDefinitions = migrated.customMeshDefinitions || []
        migrated.borderConfig = migrated.borderConfig || { type: 'rock', size: 100 }
        migrated.disableBackgroundSpawning = migrated.disableBackgroundSpawning ?? false
        // Ensure timeline events have required boolean fields
        if (Array.isArray(migrated.timeline)) {
            migrated.timeline = migrated.timeline.map((e: any) => ({
                ...e,
                isElite: e.isElite ?? false,
                isBoss: e.isBoss ?? false,
                message: e.message ?? '',
            }))
        }
    }

    migrated.schemaVersion = LEVEL_SCHEMA_VERSION
    return migrated as CustomLevelData
}

export function needsMigration(level: any): boolean {
    return (level.schemaVersion || 1) < LEVEL_SCHEMA_VERSION
}

// ============================================================
// Level CRUD
// ============================================================

export function createLevel(overrides: Partial<CustomLevelData> = {}): CustomLevelData {
    const id = overrides.id || `custom_${Date.now()}`
    return {
        id,
        schemaVersion: LEVEL_SCHEMA_VERSION,
        name: 'New Custom Level',
        description: 'A custom level',
        maxLevel: 30,
        winCondition: 'level',
        winValue: 30,
        allowedUpgrades: [],
        availableEnemies: ['drifter', 'screecher', 'bruiser'],
        difficultyMultiplier: 1.0,
        lootThemeName: 'CUSTOM LOOT',
        theme: { skyColor: 0x1a1e1a, groundColor: 0x3d453d },
        disableBackgroundSpawning: true,
        timeline: [],
        meshPlacements: [],
        paintedAreas: [],
        splinePaths: [],
        customMeshDefinitions: [],
        borderConfig: { type: 'rock', size: 100 },
        ...overrides,
    }
}

export function duplicateLevel(source: CustomLevelData, newId?: string): CustomLevelData {
    return {
        ...JSON.parse(JSON.stringify(source)),
        id: newId || `custom_${Date.now()}`,
        name: `${source.name} (Copy)`,
    }
}

export async function loadLevel(id: string): Promise<CustomLevelData | null> {
    const levels = await loadCustomLevels()
    return levels.find(l => l.id === id) || null
}

export async function saveLevel(level: CustomLevelData): Promise<boolean> {
    return saveCustomLevel(level)
}

export async function removeLevel(id: string): Promise<boolean> {
    return deleteCustomLevel(id)
}

export async function listLevels(): Promise<CustomLevelData[]> {
    return loadCustomLevels()
}

export function exportLevelJSON(level: CustomLevelData): string {
    return JSON.stringify(level, null, 2)
}

export function importLevelJSON(json: string): CustomLevelData {
    const parsed = JSON.parse(json)
    if (!parsed.id || !parsed.name || !Array.isArray(parsed.timeline)) {
        throw new Error('Invalid level JSON: missing required fields (id, name, timeline)')
    }
    return migrateLevel(parsed)
}

export async function flushToDisk(level: CustomLevelData): Promise<boolean> {
    const saved = await saveCustomLevel(level)
    clearCustomLevelsCache()
    return saved
}

export function refreshCache(): void {
    clearCustomLevelsCache()
}

// ============================================================
// Timeline Commands
// ============================================================

export function addTimelineEvent(
    level: CustomLevelData,
    event: TimelineEvent
): CustomLevelData {
    const validation = validateTimelineEvent(event)
    if (!validation.isValid) {
        throw new Error(`Invalid event: ${validation.errors.map(e => e.message).join(', ')}`)
    }
    const timeline = [...(level.timeline || []), event].sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function removeTimelineEvent(
    level: CustomLevelData,
    index: number
): CustomLevelData {
    const timeline = [...(level.timeline || [])]
    if (index < 0 || index >= timeline.length) {
        throw new Error(`Index ${index} out of bounds (0-${timeline.length - 1})`)
    }
    timeline.splice(index, 1)
    return { ...level, timeline }
}

export function updateTimelineEvent(
    level: CustomLevelData,
    index: number,
    changes: Partial<TimelineEvent>
): CustomLevelData {
    const timeline = [...(level.timeline || [])]
    if (index < 0 || index >= timeline.length) {
        throw new Error(`Index ${index} out of bounds (0-${timeline.length - 1})`)
    }
    const updated = { ...timeline[index], ...changes }
    const validation = validateTimelineEvent(updated)
    if (!validation.isValid) {
        throw new Error(`Invalid event: ${validation.errors.map(e => e.message).join(', ')}`)
    }
    timeline[index] = updated
    timeline.sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function sortTimeline(level: CustomLevelData): CustomLevelData {
    const timeline = [...(level.timeline || [])].sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function validateLevelTimeline(level: CustomLevelData) {
    return validateTimeline(level.timeline || [])
}

export function autoFixLevelTimeline(level: CustomLevelData): CustomLevelData {
    return { ...level, timeline: autoFixTimeline(level.timeline || []) }
}

export function clearTimeline(level: CustomLevelData): CustomLevelData {
    return { ...level, timeline: [] }
}

export function shiftTimeline(
    level: CustomLevelData,
    delta: number
): CustomLevelData {
    const timeline = (level.timeline || []).map(e => ({
        ...e,
        time: Math.max(0, e.time + delta)
    })).sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function scaleTimeline(
    level: CustomLevelData,
    factor: number
): CustomLevelData {
    const timeline = (level.timeline || []).map(e => ({
        ...e,
        time: e.time * factor
    })).sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function duplicateTimelineEvent(
    level: CustomLevelData,
    index: number,
    timeOffset: number = 5
): CustomLevelData {
    const timeline = level.timeline || []
    if (index < 0 || index >= timeline.length) {
        throw new Error(`Index ${index} out of bounds`)
    }
    const dup = { ...timeline[index], time: timeline[index].time + timeOffset }
    return { ...level, timeline: [...timeline, dup].sort((a, b) => a.time - b.time) }
}

export function copyEventsByIndices(
    level: CustomLevelData,
    indices: number[]
): TimelineEvent[] {
    const timeline = level.timeline || []
    return indices
        .filter(i => i >= 0 && i < timeline.length)
        .sort((a, b) => a - b)
        .map(i => timeline[i])
}

export function pasteEventsAtTime(
    level: CustomLevelData,
    events: TimelineEvent[],
    targetTime: number = 0
): CustomLevelData {
    if (!events || events.length === 0) {
        return level
    }
    const minTime = Math.min(...events.map(e => e.time))
    const timeline = level.timeline || []
    const pastedEvents = events.map(e => ({
        ...e,
        time: Math.max(0, e.time - minTime + targetTime)
    }))
    return { ...level, timeline: [...timeline, ...pastedEvents].sort((a, b) => a.time - b.time) }
}

export function getTimelineInfo(level: CustomLevelData) {
    return getTimelineStats(level.timeline || [])
}

export function getTimelineDensityInfo(level: CustomLevelData, buckets: number = 20) {
    return getTimelineDensity(level.timeline || [], buckets)
}

export function getTimelineGaps(level: CustomLevelData, minGap: number = 30) {
    return detectTimelineGaps(level.timeline || [], minGap)
}

export function exportTimelineCSV(level: CustomLevelData): string {
    return timelineToCSV(level.timeline || [])
}

export function importTimelineCSV(level: CustomLevelData, csv: string): CustomLevelData {
    const imported = timelineFromCSV(csv)
    const timeline = [...(level.timeline || []), ...imported].sort((a, b) => a.time - b.time)
    return { ...level, timeline }
}

export function replaceTimelineFromCSV(level: CustomLevelData, csv: string): CustomLevelData {
    const timeline = timelineFromCSV(csv)
    return { ...level, timeline }
}

export function addWave(
    level: CustomLevelData,
    time: number,
    enemyType: string,
    count: number,
    opts: { isElite?: boolean; isBoss?: boolean; message?: string } = {}
): CustomLevelData {
    return addTimelineEvent(level, {
        time,
        enemyType,
        count,
        isElite: opts.isElite ?? false,
        isBoss: opts.isBoss ?? false,
        message: opts.message ?? '',
    })
}

export function addWaveBatch(
    level: CustomLevelData,
    waves: Array<{ time: number; enemyType: string; count: number; isElite?: boolean; isBoss?: boolean; message?: string }>
): CustomLevelData {
    let result = level
    for (const wave of waves) {
        result = addWave(result, wave.time, wave.enemyType, wave.count, {
            isElite: wave.isElite,
            isBoss: wave.isBoss,
            message: wave.message,
        })
    }
    return result
}

// ============================================================
// Mesh Commands
// ============================================================

export function placeMesh(
    level: CustomLevelData,
    meshType: string,
    position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    opts: {
        rotation?: { x: number; y: number; z: number }
        scale?: { x: number; y: number; z: number }
        hasCollision?: boolean
        isStatic?: boolean
        id?: string
    } = {}
): CustomLevelData {
    const newMesh: MeshPlacement = {
        id: opts.id || `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meshType,
        position,
        rotation: opts.rotation || { x: 0, y: 0, z: 0 },
        scale: opts.scale || { x: 1, y: 1, z: 1 },
        isStatic: opts.isStatic ?? true,
        hasCollision: opts.hasCollision ?? true,
    }
    return { ...level, meshPlacements: [...(level.meshPlacements || []), newMesh] }
}

export function removeMesh(level: CustomLevelData, meshId: string): CustomLevelData {
    return {
        ...level,
        meshPlacements: (level.meshPlacements || []).filter(m => m.id !== meshId),
    }
}

export function updateMesh(
    level: CustomLevelData,
    meshId: string,
    changes: Partial<MeshPlacement>
): CustomLevelData {
    const meshPlacements = (level.meshPlacements || []).map(m =>
        m.id === meshId ? { ...m, ...changes, id: m.id } : m
    )
    return { ...level, meshPlacements }
}

export function clearMeshes(level: CustomLevelData): CustomLevelData {
    return { ...level, meshPlacements: [] }
}

export function batchPlaceMeshes(
    level: CustomLevelData,
    meshes: Array<{
        meshType: string
        position: { x: number; y: number; z: number }
        rotation?: { x: number; y: number; z: number }
        scale?: { x: number; y: number; z: number }
        hasCollision?: boolean
        isStatic?: boolean
    }>
): CustomLevelData {
    let result = level
    for (const mesh of meshes) {
        result = placeMesh(result, mesh.meshType, mesh.position, {
            rotation: mesh.rotation,
            scale: mesh.scale,
            hasCollision: mesh.hasCollision,
            isStatic: mesh.isStatic,
        })
    }
    return result
}

export function placeMeshRing(
    level: CustomLevelData,
    meshType: string,
    center: { x: number; z: number },
    radius: number,
    count: number,
    opts: { scale?: number; hasCollision?: boolean; isStatic?: boolean } = {}
): CustomLevelData {
    const meshes = []
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count
        meshes.push({
            meshType,
            position: {
                x: center.x + Math.cos(angle) * radius,
                y: 0,
                z: center.z + Math.sin(angle) * radius,
            },
            rotation: { x: 0, y: angle + Math.PI, z: 0 },
            scale: opts.scale ? { x: opts.scale, y: opts.scale, z: opts.scale } : undefined,
            hasCollision: opts.hasCollision,
            isStatic: opts.isStatic,
        })
    }
    return batchPlaceMeshes(level, meshes)
}

export function placeMeshLine(
    level: CustomLevelData,
    meshType: string,
    start: { x: number; z: number },
    end: { x: number; z: number },
    count: number,
    opts: { scale?: number; hasCollision?: boolean; isStatic?: boolean } = {}
): CustomLevelData {
    const meshes = []
    for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0
        meshes.push({
            meshType,
            position: {
                x: start.x + (end.x - start.x) * t,
                y: 0,
                z: start.z + (end.z - start.z) * t,
            },
            scale: opts.scale ? { x: opts.scale, y: opts.scale, z: opts.scale } : undefined,
            hasCollision: opts.hasCollision,
            isStatic: opts.isStatic,
        })
    }
    return batchPlaceMeshes(level, meshes)
}

// ============================================================
// Paint Commands
// ============================================================

export function addScatterArea(
    level: CustomLevelData,
    meshType: string,
    center: { x: number; y: number },
    size: number,
    density: number = 50
): CustomLevelData {
    const half = size / 2
    const newArea: PaintedArea = {
        id: `paint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'scatter',
        points: [
            { x: center.x - half, y: center.y - half },
            { x: center.x + half, y: center.y - half },
            { x: center.x + half, y: center.y + half },
            { x: center.x - half, y: center.y + half },
        ],
        meshType,
        density,
    }
    return { ...level, paintedAreas: [...(level.paintedAreas || []), newArea] }
}

export function addColorArea(
    level: CustomLevelData,
    color: string,
    center: { x: number; y: number },
    size: number
): CustomLevelData {
    const half = size / 2
    const newArea: PaintedArea = {
        id: `paint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'color',
        points: [
            { x: center.x - half, y: center.y - half },
            { x: center.x + half, y: center.y - half },
            { x: center.x + half, y: center.y + half },
            { x: center.x - half, y: center.y + half },
        ],
        color,
    }
    return { ...level, paintedAreas: [...(level.paintedAreas || []), newArea] }
}

export function removePaintArea(level: CustomLevelData, areaId: string): CustomLevelData {
    return {
        ...level,
        paintedAreas: (level.paintedAreas || []).filter(a => a.id !== areaId),
    }
}

export function clearPaintAreas(level: CustomLevelData): CustomLevelData {
    return { ...level, paintedAreas: [] }
}

// ============================================================
// Settings Commands
// ============================================================

export function updateSettings(
    level: CustomLevelData,
    settings: Partial<Pick<CustomLevelData,
        'name' | 'description' | 'maxLevel' | 'winCondition' | 'winValue' |
        'difficultyMultiplier' | 'lootThemeName' | 'disableBackgroundSpawning' |
        'availableEnemies' | 'allowedUpgrades'
    >>
): CustomLevelData {
    return { ...level, ...settings }
}

export function updateTheme(
    level: CustomLevelData,
    theme: Partial<{ skyColor: number; groundColor: number }>
): CustomLevelData {
    return { ...level, theme: { ...level.theme, ...theme } }
}

export function updateBorder(
    level: CustomLevelData,
    border: Partial<BorderConfig>
): CustomLevelData {
    return {
        ...level,
        borderConfig: {
            type: border.type ?? level.borderConfig?.type ?? 'rock',
            size: border.size ?? level.borderConfig?.size ?? 100,
        },
    }
}

export function validateSettings(level: CustomLevelData): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    if (!level.id) issues.push('Missing level ID')
    if (!level.name) issues.push('Missing level name')
    if (level.maxLevel < 1) issues.push('Max level must be >= 1')
    if (level.winValue < 1) issues.push('Win value must be >= 1')
    if (level.difficultyMultiplier <= 0) issues.push('Difficulty must be > 0')
    if (!level.availableEnemies?.length) issues.push('No available enemies defined')
    const timelineResult = validateTimeline(level.timeline || [])
    if (!timelineResult.isValid) {
        issues.push(...timelineResult.errors.map(e => `Timeline: ${e.message}`))
    }
    return { valid: issues.length === 0, issues }
}

// ============================================================
// Level Analysis & Scoring
// ============================================================

export interface LevelAnalysis {
    overall: number // 0-100
    pacing: { score: number; notes: string[] }
    variety: { score: number; notes: string[] }
    difficulty: { score: number; notes: string[] }
    structure: { score: number; notes: string[] }
}

export function analyzeLevel(level: CustomLevelData): LevelAnalysis {
    const timeline = level.timeline || []
    const stats = getTimelineStats(timeline)
    const gaps = detectTimelineGaps(timeline, 30)
    const density = getTimelineDensity(timeline, 20)

    // -- Pacing Score (0-100) --
    const pacingNotes: string[] = []
    let pacingScore = 100

    if (timeline.length === 0) {
        return {
            overall: 0,
            pacing: { score: 0, notes: ['No timeline events'] },
            variety: { score: 0, notes: ['No enemies'] },
            difficulty: { score: 0, notes: ['No content'] },
            structure: { score: 0, notes: ['Empty level'] },
        }
    }

    // Penalize long gaps
    if (gaps.length > 0) {
        const avgGap = gaps.reduce((s, g) => s + g.duration, 0) / gaps.length
        pacingScore -= Math.min(30, gaps.length * 8)
        pacingNotes.push(`${gaps.length} gap(s) over 30s (avg ${Math.round(avgGap)}s)`)
    }

    // Penalize no breathing room (all events within tight window)
    const sorted = [...timeline].sort((a, b) => a.time - b.time)
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i].time - sorted[i - 1].time)
    }
    if (intervals.length > 0) {
        const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length
        if (avgInterval < 3) {
            pacingScore -= 15
            pacingNotes.push(`Events too dense (avg ${avgInterval.toFixed(1)}s apart)`)
        }
        // Penalize monotonous spacing (low variance = boring)
        const variance = intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / intervals.length
        if (variance < 2 && timeline.length > 10) {
            pacingScore -= 10
            pacingNotes.push('Event spacing is very uniform - consider varying rhythm')
        }
    }

    if (stats.totalTime < 60) {
        pacingScore -= 10
        pacingNotes.push('Level is very short (<1 min)')
    }
    if (pacingNotes.length === 0) pacingNotes.push('Good pacing')
    pacingScore = Math.max(0, pacingScore)

    // -- Variety Score (0-100) --
    const varietyNotes: string[] = []
    let varietyScore = 100

    const availableCount = level.availableEnemies?.length || 1
    const usedRatio = stats.uniqueEnemyTypes / availableCount
    if (usedRatio < 0.5) {
        varietyScore -= 25
        varietyNotes.push(`Only using ${stats.uniqueEnemyTypes}/${availableCount} available enemy types`)
    } else if (usedRatio < 0.75) {
        varietyScore -= 10
        varietyNotes.push(`Using ${stats.uniqueEnemyTypes}/${availableCount} enemy types`)
    }

    // Check if one type dominates (>50% of total enemies)
    const entries = Object.entries(stats.enemyTypeDistribution)
    if (entries.length > 0) {
        const maxTypeCount = Math.max(...entries.map(([, c]) => c as number))
        if (maxTypeCount > stats.totalEnemies * 0.5 && stats.uniqueEnemyTypes > 2) {
            const dominant = entries.find(([, c]) => c === maxTypeCount)
            varietyScore -= 15
            varietyNotes.push(`"${dominant?.[0]}" dominates at ${Math.round((maxTypeCount / stats.totalEnemies) * 100)}% of total spawns`)
        }
    }

    if (stats.uniqueEnemyTypes < 3) {
        varietyScore -= 20
        varietyNotes.push('Fewer than 3 enemy types - level feels repetitive')
    }
    if (varietyNotes.length === 0) varietyNotes.push('Good enemy variety')
    varietyScore = Math.max(0, varietyScore)

    // -- Difficulty Score (0-100) --
    const diffNotes: string[] = []
    let diffScore = 100

    // Check if elites/bosses exist
    if (stats.bossCount === 0 && stats.totalTime > 180) {
        diffScore -= 15
        diffNotes.push('No boss encounters in a level over 3 minutes')
    }
    if (stats.eliteCount === 0 && stats.totalTime > 120) {
        diffScore -= 10
        diffNotes.push('No elite encounters in a level over 2 minutes')
    }

    // Check difficulty curve - first quarter should have fewer enemies than last quarter
    if (density.length >= 4) {
        const firstQuarter = density.slice(0, Math.floor(density.length / 4)).reduce((s, d) => s + d.enemyCount, 0)
        const lastQuarter = density.slice(Math.floor(density.length * 3 / 4)).reduce((s, d) => s + d.enemyCount, 0)
        if (firstQuarter > lastQuarter && stats.totalTime > 120) {
            diffScore -= 20
            diffNotes.push('Difficulty decreases over time - early game is harder than late game')
        } else if (lastQuarter > firstQuarter * 3) {
            diffNotes.push('Strong difficulty ramp - late game is 3x+ harder')
        }
    }

    // Check boss spacing
    const bossEvents = timeline.filter(e => e.isBoss)
    if (bossEvents.length >= 2) {
        const bossGaps: number[] = []
        for (let i = 1; i < bossEvents.length; i++) {
            bossGaps.push(bossEvents[i].time - bossEvents[i - 1].time)
        }
        const minBossGap = Math.min(...bossGaps)
        if (minBossGap < 30) {
            diffScore -= 10
            diffNotes.push(`Bosses too close together (${Math.round(minBossGap)}s apart)`)
        }
    }
    if (diffNotes.length === 0) diffNotes.push('Good difficulty curve')
    diffScore = Math.max(0, diffScore)

    // -- Structure Score (0-100) --
    const structNotes: string[] = []
    let structScore = 100

    const hasMeshes = (level.meshPlacements?.length || 0) > 0
    const hasPaint = (level.paintedAreas?.length || 0) > 0
    const hasMessages = timeline.some(e => e.message)

    if (!hasMeshes) {
        structScore -= 20
        structNotes.push('No mesh placements - arena feels empty')
    }
    if (!hasPaint) {
        structScore -= 10
        structNotes.push('No painted areas - ground lacks visual interest')
    }
    if (!hasMessages && stats.totalTime > 120) {
        structScore -= 10
        structNotes.push('No event messages - players get no narrative feedback')
    }
    if (!level.disableBackgroundSpawning) {
        structNotes.push('Background spawning enabled - timeline is not sole spawn source')
    }
    if (level.borderConfig?.size && level.borderConfig.size < 40) {
        structScore -= 5
        structNotes.push('Very small arena - may feel cramped')
    }
    if (structNotes.length === 0) structNotes.push('Good level structure')
    structScore = Math.max(0, structScore)

    const overall = Math.round((pacingScore + varietyScore + diffScore + structScore) / 4)

    return {
        overall,
        pacing: { score: Math.round(pacingScore), notes: pacingNotes },
        variety: { score: Math.round(varietyScore), notes: varietyNotes },
        difficulty: { score: Math.round(diffScore), notes: diffNotes },
        structure: { score: Math.round(structScore), notes: structNotes },
    }
}

// ============================================================
// JSON Commands
// ============================================================

export function applyRawJSON(json: string): CustomLevelData {
    return importLevelJSON(json)
}

export function getRawJSON(level: CustomLevelData): string {
    return exportLevelJSON(level)
}

// ============================================================
// High-level builder: Create complete level by automation
// ============================================================

export interface LevelBlueprint {
    id?: string
    name: string
    description?: string
    settings?: Partial<Pick<CustomLevelData,
        'maxLevel' | 'winCondition' | 'winValue' | 'difficultyMultiplier' |
        'lootThemeName' | 'disableBackgroundSpawning' | 'availableEnemies' | 'allowedUpgrades'
    >>
    theme?: Partial<{ skyColor: number; groundColor: number }>
    border?: Partial<BorderConfig>
    timeline: Array<{ time: number; enemyType: string; count: number; isElite?: boolean; isBoss?: boolean; message?: string }>
    meshes?: Array<{
        meshType: string
        position: { x: number; y: number; z: number }
        rotation?: { x: number; y: number; z: number }
        scale?: { x: number; y: number; z: number }
        hasCollision?: boolean
        isStatic?: boolean
    }>
    scatterAreas?: Array<{ meshType: string; center: { x: number; y: number }; size: number; density?: number }>
    colorAreas?: Array<{ color: string; center: { x: number; y: number }; size: number }>
}

export function buildLevelFromBlueprint(blueprint: LevelBlueprint): CustomLevelData {
    // 1. Create base level
    let level = createLevel({
        id: blueprint.id,
        name: blueprint.name,
        description: blueprint.description || '',
    })

    // 2. Timeline first (highest priority)
    level = addWaveBatch(level, blueprint.timeline)

    // 3. Meshes second
    if (blueprint.meshes) {
        level = batchPlaceMeshes(level, blueprint.meshes)
    }

    // 4. Paint third
    if (blueprint.scatterAreas) {
        for (const area of blueprint.scatterAreas) {
            level = addScatterArea(level, area.meshType, area.center, area.size, area.density)
        }
    }
    if (blueprint.colorAreas) {
        for (const area of blueprint.colorAreas) {
            level = addColorArea(level, area.color, area.center, area.size)
        }
    }

    // 5. Settings last
    if (blueprint.settings) {
        level = updateSettings(level, blueprint.settings)
    }
    if (blueprint.theme) {
        level = updateTheme(level, blueprint.theme)
    }
    if (blueprint.border) {
        level = updateBorder(level, blueprint.border)
    }

    return level
}

export async function buildAndSaveLevel(blueprint: LevelBlueprint): Promise<CustomLevelData> {
    const level = buildLevelFromBlueprint(blueprint)
    const validation = validateSettings(level)
    if (!validation.valid) {
        console.warn('[Automation] Level has issues:', validation.issues)
    }
    await saveLevel(level)
    return level
}

// ============================================================
// Global registration for browser console access
// ============================================================

export async function loadExampleLevel(name: string): Promise<CustomLevelData> {
    const { EXAMPLE_BLUEPRINTS } = await import('./example-levels')
    const blueprint = EXAMPLE_BLUEPRINTS[name]
    if (!blueprint) {
        throw new Error(`Unknown example: "${name}". Available: ${Object.keys(EXAMPLE_BLUEPRINTS).join(', ')}`)
    }
    return buildLevelFromBlueprint(blueprint)
}

export async function saveExampleLevel(name: string): Promise<CustomLevelData> {
    const level = await loadExampleLevel(name)
    await saveLevel(level)
    return level
}

export async function saveAllExampleLevels(): Promise<string[]> {
    const { EXAMPLE_BLUEPRINTS } = await import('./example-levels')
    const saved: string[] = []
    for (const name of Object.keys(EXAMPLE_BLUEPRINTS)) {
        await saveExampleLevel(name)
        saved.push(name)
    }
    return saved
}

export function registerGlobalAutomation() {
    if (typeof window === 'undefined') return

    const api = {
        // Schema
        migrateLevel,
        needsMigration,
        LEVEL_SCHEMA_VERSION,
        // Level CRUD
        createLevel,
        duplicateLevel,
        loadLevel,
        saveLevel,
        removeLevel,
        listLevels,
        exportLevelJSON,
        importLevelJSON,
        flushToDisk,
        refreshCache,
        // Timeline
        addTimelineEvent,
        removeTimelineEvent,
        updateTimelineEvent,
        sortTimeline,
        validateLevelTimeline,
        autoFixLevelTimeline,
        clearTimeline,
        shiftTimeline,
        scaleTimeline,
        duplicateTimelineEvent,
        copyEventsByIndices,
        pasteEventsAtTime,
        getTimelineInfo,
        getTimelineDensityInfo,
        getTimelineGaps,
        exportTimelineCSV,
        importTimelineCSV,
        replaceTimelineFromCSV,
        addWave,
        addWaveBatch,
        // Mesh
        placeMesh,
        removeMesh,
        updateMesh,
        clearMeshes,
        batchPlaceMeshes,
        placeMeshRing,
        placeMeshLine,
        // Paint
        addScatterArea,
        addColorArea,
        removePaintArea,
        clearPaintAreas,
        // Settings
        updateSettings,
        updateTheme,
        updateBorder,
        validateSettings,
        // Analysis
        analyzeLevel,
        // JSON
        applyRawJSON,
        getRawJSON,
        // Builder
        buildLevelFromBlueprint,
        buildAndSaveLevel,
        // Examples
        loadExampleLevel,
        saveExampleLevel,
        saveAllExampleLevels,
        // Constants
        VALID_ENEMY_TYPES: VALID_ENEMY_TYPES_ARRAY,
    }

    ;(window as any).__levelAutomation = api
    console.log('[LevelAutomation] Registered at window.__levelAutomation')
    console.log('[LevelAutomation] Commands:', Object.keys(api).join(', '))
}
