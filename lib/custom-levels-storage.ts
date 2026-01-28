/**
 * Custom Levels Storage
 *
 * Provides a unified interface for storing and retrieving custom levels
 * created via the Level Editor. Works with both API (server-side) and
 * localStorage (client-side fallback).
 */

import { CustomLevelData } from "@/components/game/debug/LevelEditor"

// In-memory cache for custom levels
let customLevelsCache: CustomLevelData[] = []
let cacheInitialized = false

/**
 * Load all custom levels from API or localStorage
 */
export async function loadCustomLevels(): Promise<CustomLevelData[]> {
    // Don't use cache - always load fresh to ensure sync
    // (Cache can be stale after server restart)

    let apiLevels: CustomLevelData[] = []
    let localLevels: CustomLevelData[] = []

    try {
        // Try API first (only on localhost)
        if (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {

            const response = await fetch('/api/levels/list')
            if (response.ok) {
                const data = await response.json()
                apiLevels = data.levels || []
                console.log(`[Storage] Loaded ${apiLevels.length} levels from API`)
            }
        }
    } catch (error) {
        console.warn('Failed to load custom levels from API:', error)
    }

    // ALWAYS check localStorage
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('customLevels')
        if (stored) {
            try {
                localLevels = JSON.parse(stored)
                console.log(`[Storage] Loaded ${localLevels.length} levels from localStorage`)
            } catch (error) {
                console.error('Failed to parse custom levels from localStorage:', error)
            }
        }
    }

    // Merge both sources
    const levelMap = new Map<string, CustomLevelData>()
    
    // Start with local levels
    localLevels.forEach(level => levelMap.set(level.id, level))
    
    // Overlay API levels (they take precedence for same ID)
    apiLevels.forEach(level => levelMap.set(level.id, level))
    
    customLevelsCache = Array.from(levelMap.values())
    
    console.log(`[Storage] Merged levels: ${customLevelsCache.length} total`)

    cacheInitialized = true
    return customLevelsCache
}

/**
 * Get a specific custom level by ID
 */
export async function getCustomLevel(id: string): Promise<CustomLevelData | null> {
    const levels = await loadCustomLevels()
    return levels.find(level => level.id === id) || null
}

/**
 * Save a custom level
 */
export async function saveCustomLevel(level: CustomLevelData): Promise<boolean> {
    let savedToAPI = false

    try {
        // Try API first (only on localhost)
        if (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {

            const response = await fetch('/api/levels/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(level)
            })

            if (response.ok) {
                savedToAPI = true
                console.log(`[Storage] Saved level ${level.id} to API`)
            }
        }
    } catch (error) {
        console.warn('Failed to save to API:', error)
    }

    // ALWAYS save to localStorage as backup (whether API succeeded or not)
    if (typeof window !== 'undefined') {
        const levels = await loadCustomLevels()
        const updated = levels.filter(l => l.id !== level.id)
        updated.push(level)
        localStorage.setItem('customLevels', JSON.stringify(updated))
        customLevelsCache = updated
        console.log(`[Storage] Saved level ${level.id} to localStorage (backup)`)
        return true
    }

    return savedToAPI
}

/**
 * Delete a custom level
 */
export async function deleteCustomLevel(id: string): Promise<boolean> {
    try {
        // Try API first (only on localhost)
        if (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {

            const response = await fetch(`/api/levels/${id}`, { method: 'DELETE' })

            if (response.ok) {
                // Update cache
                customLevelsCache = customLevelsCache.filter(l => l.id !== id)
                return true
            }
        }
    } catch (error) {
        console.warn('Failed to delete from API, falling back to localStorage:', error)
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
        const levels = await loadCustomLevels()
        const updated = levels.filter(l => l.id !== id)
        localStorage.setItem('customLevels', JSON.stringify(updated))
        customLevelsCache = updated
        return true
    }

    return false
}

/**
 * Clear the cache (useful for forcing a reload)
 */
export function clearCustomLevelsCache() {
    cacheInitialized = false
    customLevelsCache = []
}

/**
 * Get all levels (default WORLDS + custom levels)
 */
export async function getAllLevels(): Promise<CustomLevelData[]> {
    const { WORLDS } = await import('@/components/game/data/worlds')
    const customLevels = await loadCustomLevels()

    // Convert WORLDS to CustomLevelData format
    const defaultWorldsAsCustom: CustomLevelData[] = WORLDS.map(world => ({
        ...world,
        timeline: [],
        meshPlacements: [],
        paintedAreas: [],
        borderConfig: { type: 'rock' as const, size: 100 }
    }))

    return [...defaultWorldsAsCustom, ...customLevels]
}
