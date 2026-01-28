"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import {
    Plus, Save, Download, Upload, Play, Edit, Trash2,
    ChevronDown, ChevronUp, Settings, List, Palette, Box,
    Copy, RefreshCw, X, Check, FileJson
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WORLDS, WorldData } from "@/components/game/data/worlds"
import { darkForestTimeline } from "@/components/game/data/dark_forest_timeline"
import { frozenWasteTimeline } from "@/components/game/data/frozen_waste_timeline"
import { MESH_TYPES, MESH_CATEGORIES } from "@/components/game/data/meshes"
import { VisualLevelEditor } from "./VisualLevelEditor"
import { loadCustomLevels as loadCustomLevelsFromStorage, saveCustomLevel as saveToStorage } from "@/lib/custom-levels-storage"
import { VALID_ENEMY_TYPES_ARRAY, getTimelineStats, getTimelineDensity, detectTimelineGaps, autoFixTimeline, timelineToCSV, timelineFromCSV, type TimelineEvent } from "@/lib/timeline-validation"
import { registerGlobalAutomation } from "@/lib/level-automation"

// Re-export TimelineEvent for other components
export type { TimelineEvent }

interface LevelEditorProps {
    isVisible: boolean
    onClose: () => void
    onTestLevel?: (levelData: CustomLevelData) => void
    onLevelsChanged?: () => void  // Notify parent when levels are saved/deleted
}

export interface SplinePath {
    id: string
    controlPoints: { x: number, z: number }[]
    meshType: string
    spacing: number
    scale: number
    closed: boolean
    hasCollision: boolean
}

export const LEVEL_SCHEMA_VERSION = 2

export interface CustomLevelData extends WorldData {
    schemaVersion?: number
    timeline: TimelineEvent[]
    meshPlacements?: MeshPlacement[]
    paintedAreas?: PaintedArea[]
    borderConfig?: BorderConfig
    customMeshDefinitions?: CustomMeshDefinition[]
    splinePaths?: SplinePath[]
}

export interface CustomMeshDefinition {
    id: string
    name: string
    url: string
    scale?: number
}

export interface MeshPlacement {
    id: string
    meshType: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
    scale: { x: number, y: number, z: number }
    isStatic: boolean
    hasCollision: boolean
}

export interface PaintedArea {
    id: string
    type: 'scatter' | 'color'
    points: { x: number, y: number }[]
    meshType?: string // for scatter
    density?: number // for scatter
    color?: string // for color painting
    shape?: 'circle' | 'square'
    hardness?: number // 0 to 1
    opacity?: number // 0 to 1
    isEraser?: boolean
}

export interface BorderConfig {
    type: 'rock' | 'tree' | 'none'
    size: number // world size
}

type EditorTab = 'levels' | 'timeline' | 'meshes' | 'paint' | 'settings' | 'json'

export function LevelEditor({ isVisible, onClose, onTestLevel, onLevelsChanged }: LevelEditorProps) {
    const [activeTab, setActiveTab] = useState<EditorTab>('levels')
    const [customLevels, setCustomLevels] = useState<CustomLevelData[]>([])
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
    const [editingLevel, setEditingLevel] = useState<CustomLevelData | null>(null)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showVisualEditor, setShowVisualEditor] = useState(false)

    // Check if running on localhost
    const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    useEffect(() => {
        if (isLocalhost) {
            registerGlobalAutomation()
            loadCustomLevelsFromStorage().then(levels => {
                setCustomLevels(levels)
                console.log('[LevelEditor] Loaded', levels.length, 'custom levels')
            })
        }
    }, [isLocalhost])

    const saveCustomLevel = async (level: CustomLevelData) => {
        console.log('[LevelEditor] Saving level:', level.id, level.name)

        // Use shared storage module (saves to both API and localStorage)
        await saveToStorage(level)

        // Reload editor's own list from storage
        const reloaded = await loadCustomLevelsFromStorage()
        setCustomLevels(reloaded)
        console.log('[LevelEditor] ✅ Editor list updated with', reloaded.length, 'levels')

        // Notify parent (updates main menu)
        if (onLevelsChanged) {
            onLevelsChanged()
            console.log('[LevelEditor] ✅ Notified parent - Main menu will update')
        }
    }

    const createNewLevel = () => {
        const newLevel: CustomLevelData = {
            id: `custom_${Date.now()}`,
            name: 'New Custom Level',
            description: 'A custom level for testing',
            maxLevel: 30,
            winCondition: 'level',
            winValue: 30,
            allowedUpgrades: [],
            availableEnemies: ['drifter', 'screecher', 'bruiser'],
            difficultyMultiplier: 1.0,
            lootThemeName: 'CUSTOM LOOT',
            theme: {
                skyColor: 0x1a1e1a,
                groundColor: 0x3d453d
            },
            disableBackgroundSpawning: true, // Custom levels default to timeline-only spawning
            timeline: [],
            meshPlacements: [],
            paintedAreas: [],
            splinePaths: [],
            borderConfig: { type: 'rock', size: 100 }
        }
        setEditingLevel(newLevel)
        setActiveTab('settings')
    }

    const duplicateLevel = (level: CustomLevelData) => {
        const duplicated: CustomLevelData = {
            ...level,
            id: `custom_${Date.now()}`,
            name: `${level.name} (Copy)`
        }
        setEditingLevel(duplicated)
    }

    const deleteLevel = async (levelId: string) => {
        if (!confirm('Are you sure you want to delete this level?')) return

        try {
            // Try API delete
            await fetch(`/api/levels/${levelId}`, { method: 'DELETE' })
        } catch (error) {
            console.warn('[LevelEditor] API delete failed:', error)
        }

        // ALWAYS update localStorage
        const updated = customLevels.filter(l => l.id !== levelId)
        localStorage.setItem('customLevels', JSON.stringify(updated))

        // Reload from storage
        const reloaded = await loadCustomLevelsFromStorage()
        setCustomLevels(reloaded)
        console.log('[LevelEditor] ✅ Deleted level, now have', reloaded.length, 'custom levels')

        // Notify parent component that levels have changed
        if (onLevelsChanged) {
            onLevelsChanged()
        }

        if (selectedLevelId === levelId) {
            setSelectedLevelId(null)
            setEditingLevel(null)
        }
    }

    const exportLevel = (level: CustomLevelData) => {
        const json = JSON.stringify(level, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${level.id}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const importLevel = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            const text = await file.text()
            try {
                const level = JSON.parse(text) as CustomLevelData
                await saveCustomLevel(level)
            } catch (error) {
                alert('Invalid level file format')
            }
        }
        input.click()
    }

    const testLevel = async () => {
        if (editingLevel && onTestLevel) {
            // Auto-save before testing to ensure changes persist
            await saveCustomLevel(editingLevel)
            onTestLevel(editingLevel)
        }
    }

    const openVisualEditor = () => {
        if (editingLevel) {
            setShowVisualEditor(true)
        }
    }

    if (!isVisible || !isLocalhost) return null

    // Show visual editor if a level is being edited visually
    if (showVisualEditor && editingLevel) {
        return (
            <VisualLevelEditor
                isVisible={true}
                onClose={() => setShowVisualEditor(false)}
                levelData={editingLevel}
                onUpdateLevel={setEditingLevel}
                onSave={async () => {
                    await saveCustomLevel(editingLevel)
                }}
                onTest={testLevel}
            />
        )
    }

    return (
        <div
            className="fixed top-4 right-4 w-[800px] bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50"
            style={{ maxHeight: isMinimized ? '60px' : '92vh' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Level Editor</span>
                    <span className="text-xs text-white/40 font-mono">DEBUG MODE</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                        {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-red-500/20"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Tab Navigation */}
                    <div className="flex gap-1 px-2 py-2 bg-white/5 border-b border-white/10 overflow-x-auto">
                        <TabButton
                            icon={List}
                            label="Levels"
                            active={activeTab === 'levels'}
                            onClick={() => setActiveTab('levels')}
                        />
                        <TabButton
                            icon={Edit}
                            label="Timeline"
                            active={activeTab === 'timeline'}
                            onClick={() => setActiveTab('timeline')}
                            disabled={!editingLevel}
                        />
                        <TabButton
                            icon={Box}
                            label="Meshes"
                            active={activeTab === 'meshes'}
                            onClick={() => setActiveTab('meshes')}
                            disabled={!editingLevel}
                        />
                        <TabButton
                            icon={Palette}
                            label="Paint"
                            active={activeTab === 'paint'}
                            onClick={() => setActiveTab('paint')}
                            disabled={!editingLevel}
                        />
                        <TabButton
                            icon={Settings}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                            disabled={!editingLevel}
                        />
                        <TabButton
                            icon={FileJson}
                            label="JSON"
                            active={activeTab === 'json'}
                            onClick={() => setActiveTab('json')}
                            disabled={!editingLevel}
                        />
                    </div>

                    {/* Content Area */}
                    <div 
                        className={`${activeTab === 'json' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`} 
                        style={{ height: activeTab === 'json' ? 'calc(92vh - 140px)' : 'auto', maxHeight: 'calc(92vh - 140px)' }}
                    >
                        {activeTab === 'levels' && (
                            <LevelsTab
                                levels={[...WORLDS, ...customLevels]}
                                customLevels={customLevels}
                                selectedLevelId={selectedLevelId}
                                onSelectLevel={(id) => {
                                    setSelectedLevelId(id)
                                    const level = customLevels.find(l => l.id === id)
                                    if (level) {
                                        setEditingLevel(level)
                                    } else {
                                        // Load from default worlds
                                        const world = WORLDS.find(w => w.id === id)
                                        if (world) {
                                            const timeline = world.id === 'dark_forest' ? darkForestTimeline : frozenWasteTimeline
                                            setEditingLevel({
                                                ...world,
                                                timeline,
                                                meshPlacements: [],
                                                paintedAreas: [],
                                                borderConfig: { type: 'rock', size: 100 }
                                            })
                                        }
                                    }
                                }}
                                onCreateNew={createNewLevel}
                                onDuplicate={duplicateLevel}
                                onDelete={deleteLevel}
                                onExport={exportLevel}
                                onImport={importLevel}
                            />
                        )}

                        {activeTab === 'timeline' && editingLevel && (
                            <TimelineTab
                                level={editingLevel}
                                onUpdate={setEditingLevel}
                            />
                        )}

                        {activeTab === 'meshes' && editingLevel && (
                            <MeshesTab
                                level={editingLevel}
                                onUpdate={setEditingLevel}
                            />
                        )}

                        {activeTab === 'paint' && editingLevel && (
                            <PaintTab
                                level={editingLevel}
                                onUpdate={setEditingLevel}
                            />
                        )}

                        {activeTab === 'settings' && editingLevel && (
                            <SettingsTab
                                level={editingLevel}
                                onUpdate={setEditingLevel}
                            />
                        )}

                        {activeTab === 'json' && editingLevel && (
                            <JsonTab
                                level={editingLevel}
                                onUpdate={setEditingLevel}
                            />
                        )}
                    </div>

                    {/* Footer Actions */}
                    {editingLevel && (
                        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white/5 border-t border-white/10">
                            <div className="text-xs text-white/60">
                                Editing: <span className="text-white/90 font-medium">{editingLevel.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={openVisualEditor}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Visual Editor
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => saveCustomLevel(editingLevel)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={testLevel}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Play className="w-3 h-3 mr-1" />
                                    Test
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ... (Rest of the previous components)

// New JSON Tab Component
function JsonTab({ level, onUpdate }: { level: CustomLevelData, onUpdate: (level: CustomLevelData) => void }) {
    const [jsonText, setJsonText] = useState(JSON.stringify(level, null, 2))
    const [error, setError] = useState<string | null>(null)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setJsonText(JSON.stringify(level, null, 2))
    }, [level.id])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        setJsonText(text)

        // Clear previous timer
        if (debounceTimer) clearTimeout(debounceTimer)

        // Parse and validate after debounce
        const timer = setTimeout(() => {
            try {
                const parsed = JSON.parse(text)
                setError(null)
                onUpdate(parsed)
            } catch (err: any) {
                setError(err.message)
            }
        }, 300)

        setDebounceTimer(timer)
    }, [debounceTimer, onUpdate])

    const handleBlur = useCallback(() => {
        // Re-format on blur if valid
        try {
            const parsed = JSON.parse(jsonText)
            setJsonText(JSON.stringify(parsed, null, 2))
        } catch (e) {
            // Ignore
        }
    }, [jsonText])

    return (
        <div className="p-4 space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Raw JSON Editor</div>
                {error && <span className="text-xs text-red-400">{error}</span>}
                {!error && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3"/> Valid</span>}
            </div>
            
            <textarea
                value={jsonText}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`flex-1 w-full min-h-[400px] bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-lg p-3 font-mono text-xs text-white/80 resize-none focus:outline-none focus:border-white/30`}
                spellCheck={false}
            />
            
            <div className="text-xs text-white/40 italic">
                Directly editing level data. Be careful with IDs and internal structures.
            </div>
        </div>
    )
}


// Tab Button Component
const TabButton = memo(function TabButton({ icon: Icon, label, active, onClick, disabled }: {
    icon: any
    label: string
    active: boolean
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${active
                    ? 'bg-white/20 text-white'
                    : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    )
})

// Levels Tab
function LevelsTab({ levels, customLevels, selectedLevelId, onSelectLevel, onCreateNew, onDuplicate, onDelete, onExport, onImport }: {
    levels: WorldData[]
    customLevels: CustomLevelData[]
    selectedLevelId: string | null
    onSelectLevel: (id: string) => void
    onCreateNew: () => void
    onDuplicate: (level: CustomLevelData) => void
    onDelete: (id: string) => void
    onExport: (level: CustomLevelData) => void
    onImport: () => void
}) {
    return (
        <div className="p-4 space-y-3">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    onClick={onCreateNew}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    New Level
                </Button>
                <Button
                    size="sm"
                    onClick={onImport}
                    variant="outline"
                    className="border-white/20 text-white/80 hover:bg-white/10"
                >
                    <Upload className="w-3 h-3 mr-1" />
                    Import
                </Button>
            </div>

            <div className="space-y-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Default Worlds</div>
                {levels.filter(l => !customLevels.find(c => c.id === l.id)).map(level => (
                    <LevelCard
                        key={level.id}
                        level={level}
                        isCustom={false}
                        isSelected={selectedLevelId === level.id}
                        onSelect={() => onSelectLevel(level.id)}
                        onDuplicate={() => onDuplicate(level as CustomLevelData)}
                        onDelete={() => {}}
                        onExport={() => {}}
                    />
                ))}
            </div>

            {customLevels.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Custom Levels</div>
                    {customLevels.map(level => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            isCustom={true}
                            isSelected={selectedLevelId === level.id}
                            onSelect={() => onSelectLevel(level.id)}
                            onDuplicate={() => onDuplicate(level)}
                            onDelete={() => onDelete(level.id)}
                            onExport={() => onExport(level)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function LevelCard({ level, isCustom, isSelected, onSelect, onDuplicate, onDelete, onExport }: {
    level: WorldData
    isCustom: boolean
    isSelected: boolean
    onSelect: () => void
    onDuplicate: () => void
    onDelete: () => void
    onExport: () => void
}) {
    return (
        <div
            onClick={onSelect}
            className={`
                p-3 rounded-lg border transition-all cursor-pointer
                ${isSelected
                    ? 'bg-purple-600/20 border-purple-400/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="text-sm font-bold text-white">{level.name}</div>
                    <div className="text-xs text-white/60 mt-0.5">{level.description}</div>
                    <div className="flex gap-2 mt-2">
                        <span className="text-xs text-white/40">Lvl {level.maxLevel}</span>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-white/40">x{level.difficultyMultiplier}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                        <Copy className="w-3 h-3" />
                    </Button>
                    {isCustom && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onExport(); }}
                                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                            >
                                <Download className="w-3 h-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Timeline Tab
function TimelineTab({ level, onUpdate }: { level: CustomLevelData, onUpdate: (level: CustomLevelData) => void }) {
    const enemyTypes = level.availableEnemies?.length > 0
        ? [...level.availableEnemies].sort()
        : VALID_ENEMY_TYPES_ARRAY

    const [editingEvent, setEditingEvent] = useState<number | null>(null)
    const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set())
    const [newEvent, setNewEvent] = useState<TimelineEvent>({
        time: 0,
        enemyType: 'drifter',
        count: 10,
        isBoss: false,
        isElite: false,
        message: ''
    })
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [showBatchOps, setShowBatchOps] = useState(false)
    const [batchShiftAmount, setBatchShiftAmount] = useState(5)
    const [selectionShiftAmount, setSelectionShiftAmount] = useState(5)
    const [selectionEnemyType, setSelectionEnemyType] = useState('')
    const [clipboardEvents, setClipboardEvents] = useState<TimelineEvent[] | null>(null)
    const [clipboardMessage, setClipboardMessage] = useState<string>('')

    const toggleSelect = useCallback((index: number) => {
        setSelectedEvents(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }, [])

    const selectAll = useCallback(() => {
        setSelectedEvents(prev =>
            prev.size === (level.timeline?.length || 0) ? new Set() : new Set((level.timeline || []).map((_, i) => i))
        )
    }, [level.timeline?.length])

    const deleteSelected = useCallback(() => {
        if (selectedEvents.size === 0) return
        const timeline = (level.timeline || []).filter((_, i) => !selectedEvents.has(i))
        setSelectedEvents(new Set())
        onUpdate({ ...level, timeline })
    }, [selectedEvents, level, onUpdate])

    const shiftSelected = useCallback((delta: number) => {
        if (selectedEvents.size === 0) return
        const timeline = (level.timeline || []).map((e, i) =>
            selectedEvents.has(i) ? { ...e, time: Math.max(0, e.time + delta) } : e
        ).sort((a, b) => a.time - b.time)
        setSelectedEvents(new Set())
        onUpdate({ ...level, timeline })
    }, [selectedEvents, level, onUpdate])

    const changeSelectedType = useCallback((newType: string) => {
        if (selectedEvents.size === 0 || !newType) return
        const timeline = (level.timeline || []).map((e, i) =>
            selectedEvents.has(i) ? { ...e, enemyType: newType } : e
        )
        setSelectedEvents(new Set())
        onUpdate({ ...level, timeline })
    }, [selectedEvents, level, onUpdate])

    const copySelected = useCallback(() => {
        if (selectedEvents.size === 0) return
        const events = Array.from(selectedEvents)
            .sort((a, b) => a - b)
            .map(i => (level.timeline || [])[i])
        setClipboardEvents(events)
        setClipboardMessage(`Copied ${events.length} event(s) to clipboard`)
        setTimeout(() => setClipboardMessage(''), 2000)
    }, [selectedEvents, level.timeline])

    const pasteEvents = useCallback((offsetTime: number = 0) => {
        if (!clipboardEvents || clipboardEvents.length === 0) return
        const minTime = Math.min(...clipboardEvents.map(e => e.time))
        const timeline = level.timeline || []
        const pastedEvents = clipboardEvents.map(e => ({
            ...e,
            time: Math.max(0, e.time - minTime + offsetTime)
        }))
        onUpdate({ ...level, timeline: [...timeline, ...pastedEvents].sort((a, b) => a.time - b.time) })
        setClipboardMessage(`Pasted ${pastedEvents.length} event(s)`)
        setTimeout(() => setClipboardMessage(''), 2000)
    }, [clipboardEvents, level.timeline, onUpdate])

    const validateNewEvent = () => {
        const { validateTimelineEvent } = require('@/lib/timeline-validation')
        const result = validateTimelineEvent(newEvent)
        if (!result.isValid) {
            setValidationErrors(result.errors.map((e: any) => e.message))
            return false
        }
        setValidationErrors([])
        return true
    }

    const addEvent = () => {
        if (!validateNewEvent()) return
        const timeline = [...(level.timeline || []), newEvent].sort((a, b) => a.time - b.time)
        onUpdate({ ...level, timeline })
        setNewEvent({
            time: newEvent.time + 10,
            enemyType: 'drifter',
            count: 10,
            isBoss: false,
            isElite: false,
            message: ''
        })
    }

    const updateEvent = (index: number, updatedEvent: TimelineEvent) => {
        const { validateTimelineEvent } = require('@/lib/timeline-validation')
        const result = validateTimelineEvent(updatedEvent)
        if (!result.isValid) {
            setValidationErrors(result.errors.map((e: any) => e.message))
            return
        }
        setValidationErrors([])
        const timeline = [...(level.timeline || [])]
        timeline[index] = updatedEvent
        timeline.sort((a, b) => a.time - b.time)
        onUpdate({ ...level, timeline })
        setEditingEvent(null)
    }

    const deleteEvent = (index: number) => {
        const timeline = level.timeline?.filter((_, i) => i !== index) || []
        onUpdate({ ...level, timeline })
    }

    const duplicateEvent = (event: TimelineEvent) => {
        const newTime = event.time + 5
        const timeline = [...(level.timeline || []), { ...event, time: newTime }].sort((a, b) => a.time - b.time)
        onUpdate({ ...level, timeline })
    }

    const shiftAllEvents = (delta: number) => {
        const timeline = (level.timeline || []).map(e => ({
            ...e,
            time: Math.max(0, e.time + delta)
        })).sort((a, b) => a.time - b.time)
        onUpdate({ ...level, timeline })
    }

    const scaleAllTimes = (factor: number) => {
        const timeline = (level.timeline || []).map(e => ({
            ...e,
            time: e.time * factor
        })).sort((a, b) => a.time - b.time)
        onUpdate({ ...level, timeline })
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="p-4 space-y-3">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-2">
                    {validationErrors.map((err, i) => (
                        <div key={i} className="text-xs text-red-300">{err}</div>
                    ))}
                </div>
            )}

            {/* Pattern Templates */}
            <PatternTemplates
                level={level}
                onAddPattern={(timeline) => onUpdate({ ...level, timeline })}
                enemyTypes={enemyTypes}
            />

            {/* Add New Event Form */}
            <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">Add Spawn Event</div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Time (sec)</label>
                        <input
                            type="number"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent({ ...newEvent, time: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Count</label>
                        <input
                            type="number"
                            value={newEvent.count}
                            onChange={(e) => setNewEvent({ ...newEvent, count: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Enemy Type ({enemyTypes.length} available)</label>
                    <select
                        value={newEvent.enemyType}
                        onChange={(e) => setNewEvent({ ...newEvent, enemyType: e.target.value })}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                        {enemyTypes.map(type => (
                            <option key={type} value={type}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={newEvent.isElite}
                            onChange={(e) => setNewEvent({ ...newEvent, isElite: e.target.checked })}
                            className="rounded"
                        />
                        Elite
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={newEvent.isBoss}
                            onChange={(e) => setNewEvent({ ...newEvent, isBoss: e.target.checked })}
                            className="rounded"
                        />
                        Boss
                    </label>
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Message (optional)</label>
                    <input
                        type="text"
                        value={newEvent.message || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, message: e.target.value })}
                        placeholder="e.g., 'A dark presence approaches...'"
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder:text-white/30"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={addEvent}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Event
                    </Button>
                    {clipboardEvents && clipboardEvents.length > 0 && (
                        <Button
                            size="sm"
                            onClick={() => pasteEvents(newEvent.time)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            Paste at {formatTime(newEvent.time)}
                        </Button>
                    )}
                </div>
            </div>

            {/* Batch Operations */}
            {level.timeline && level.timeline.length > 0 && (
                <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-2">
                    <button
                        onClick={() => setShowBatchOps(!showBatchOps)}
                        className="text-xs text-blue-300 font-bold uppercase tracking-wider w-full text-left"
                    >
                        {showBatchOps ? '▼' : '▶'} Batch Operations
                    </button>
                    {showBatchOps && (
                        <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-white/60 mb-1 block">Shift by (sec)</label>
                                    <input
                                        type="number"
                                        value={batchShiftAmount}
                                        onChange={(e) => setBatchShiftAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                    />
                                </div>
                                <div>
                                    <Button
                                        size="sm"
                                        onClick={() => shiftAllEvents(batchShiftAmount)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs mt-5"
                                    >
                                        Shift All
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => scaleAllTimes(1.5)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    ×1.5 Speed
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => scaleAllTimes(0.75)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    ×0.75 Speed
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const fixed = autoFixTimeline(level.timeline || [])
                                        onUpdate({ ...level, timeline: fixed })
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                >
                                    Auto-Fix
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const csv = timelineToCSV(level.timeline || [])
                                        const blob = new Blob([csv], { type: 'text/csv' })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `${level.id}_timeline.csv`
                                        a.click()
                                        URL.revokeObjectURL(url)
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    Export CSV
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = '.csv'
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0]
                                            if (!file) return
                                            const text = await file.text()
                                            const imported = timelineFromCSV(text)
                                            if (imported.length > 0) {
                                                onUpdate({ ...level, timeline: [...(level.timeline || []), ...imported].sort((a, b) => a.time - b.time) })
                                            }
                                        }
                                        input.click()
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    Import CSV
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline Stats & Density */}
            {level.timeline && level.timeline.length > 0 && (
                <>
                    <TimelineStatsBar timeline={level.timeline} formatTime={formatTime} />
                    <TimelineEventTimeline timeline={level.timeline} formatTime={formatTime} />
                    <LevelAnalysisDisplay level={level} />
                </>
            )}

            {/* Timeline Events List */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {level.timeline && level.timeline.length > 0 && (
                            <input
                                type="checkbox"
                                checked={selectedEvents.size === level.timeline.length && level.timeline.length > 0}
                                onChange={selectAll}
                                className="rounded"
                                title="Select all"
                            />
                        )}
                        <div className="text-xs text-white/60 uppercase tracking-wider font-bold">
                            Timeline ({level.timeline?.length || 0} events)
                            {selectedEvents.size > 0 && (
                                <span className="text-cyan-400 ml-1">({selectedEvents.size} selected)</span>
                            )}
                        </div>
                    </div>
                    {level.timeline && level.timeline.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdate({ ...level, timeline: [] })}
                            className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Selection Toolbar */}
                {selectedEvents.size > 0 && (
                    <div className="bg-cyan-600/10 border border-cyan-400/30 rounded-lg p-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                                {selectedEvents.size} Selected
                            </div>
                            {clipboardMessage && (
                                <div className="text-xs text-cyan-300">{clipboardMessage}</div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                size="sm"
                                onClick={copySelected}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                onClick={deleteSelected}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs"
                            >
                                Delete
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => pasteEvents(Math.max(...selectedEvents, -Infinity) >= 0 ? (level.timeline || [])[Math.max(...selectedEvents)]?.time || 0 : 0)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50"
                                disabled={!clipboardEvents || clipboardEvents.length === 0}
                            >
                                Paste
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    value={selectionShiftAmount}
                                    onChange={(e) => setSelectionShiftAmount(parseFloat(e.target.value) || 0)}
                                    className="w-16 px-1 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                    placeholder="sec"
                                />
                                <Button
                                    size="sm"
                                    onClick={() => shiftSelected(selectionShiftAmount)}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs flex-1"
                                >
                                    Shift
                                </Button>
                            </div>
                            <div className="flex gap-1">
                                <select
                                    value={selectionEnemyType}
                                    onChange={(e) => setSelectionEnemyType(e.target.value)}
                                    className="flex-1 px-1 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                >
                                    <option value="">Type...</option>
                                    {enemyTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    onClick={() => changeSelectedType(selectionEnemyType)}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                                    disabled={!selectionEnemyType}
                                >
                                    Set
                                </Button>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEvents(new Set())}
                            className="text-xs text-white/50 hover:text-white/80"
                        >
                            Deselect All
                        </Button>
                    </div>
                )}

                {(!level.timeline || level.timeline.length === 0) ? (
                    <div className="text-center py-8 text-white/40 text-xs">
                        No spawn events yet. Add your first event above.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {level.timeline.map((event, index) => {
                            const prevEvent = index > 0 ? level.timeline[index - 1] : null
                            const gap = prevEvent ? event.time - prevEvent.time : 0
                            const isPhaseBreak = gap >= 10 || (index > 0 && event.message)
                            return (
                                <div key={index}>
                                    {isPhaseBreak && index > 0 && (
                                        <div className="flex items-center gap-2 py-1.5 px-1">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                                            <span className="text-xs text-purple-400/60 font-mono whitespace-nowrap">
                                                {gap >= 10 ? `+${Math.round(gap)}s gap` : 'phase'}
                                            </span>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                                        </div>
                                    )}
                                    <TimelineEventCard
                                        event={event}
                                        index={index}
                                        isEditing={editingEvent === index}
                                        isSelected={selectedEvents.has(index)}
                                        enemyTypes={enemyTypes}
                                        onToggleSelect={() => toggleSelect(index)}
                                        onEdit={() => setEditingEvent(index)}
                                        onSave={(updated) => updateEvent(index, updated)}
                                        onCancel={() => setEditingEvent(null)}
                                        onDelete={() => deleteEvent(index)}
                                        onDuplicate={() => duplicateEvent(event)}
                                        formatTime={formatTime}
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

const TimelineStatsBar = memo(function TimelineStatsBar({ timeline, formatTime }: { timeline: TimelineEvent[], formatTime: (s: number) => string }) {
    const stats = useMemo(() => getTimelineStats(timeline), [timeline])
    const density = useMemo(() => getTimelineDensity(timeline, 30), [timeline])
    const gaps = useMemo(() => detectTimelineGaps(timeline, 30), [timeline])
    const maxEnemies = useMemo(() => Math.max(...density.map(d => d.enemyCount), 1), [density])

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
            {/* Stats row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div className="text-xs text-white/60">
                    <span className="text-white/90 font-medium">{stats.eventCount}</span> events
                </div>
                <div className="text-xs text-white/60">
                    <span className="text-white/90 font-medium">{stats.totalEnemies}</span> enemies
                </div>
                <div className="text-xs text-white/60">
                    <span className="text-white/90 font-medium">{formatTime(stats.totalTime)}</span> duration
                </div>
                <div className="text-xs text-white/60">
                    <span className="text-white/90 font-medium">{stats.uniqueEnemyTypes}</span> types
                </div>
                {stats.eliteCount > 0 && (
                    <div className="text-xs text-yellow-400">
                        {stats.eliteCount} elite
                    </div>
                )}
                {stats.bossCount > 0 && (
                    <div className="text-xs text-red-400">
                        {stats.bossCount} boss
                    </div>
                )}
            </div>

            {/* Density heatmap */}
            <div>
                <div className="text-xs text-white/40 mb-1">Spawn Density</div>
                <div className="flex h-6 gap-px rounded overflow-hidden">
                    {density.map((bucket, i) => {
                        const intensity = bucket.enemyCount / maxEnemies
                        const r = Math.round(100 + 155 * intensity)
                        const g = Math.round(60 * (1 - intensity))
                        const b = Math.round(200 * (1 - intensity * 0.5))
                        return (
                            <div
                                key={i}
                                className="flex-1 relative group cursor-default"
                                style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})` }}
                                title={`${formatTime(bucket.time)}: ${bucket.enemyCount} enemies (${bucket.eventCount} events)`}
                            >
                                <div className="absolute bottom-0 left-0 right-0 bg-purple-400/60"
                                    style={{ height: `${intensity * 100}%` }} />
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-white/30">0:00</span>
                    <span className="text-xs text-white/30">{formatTime(stats.totalTime)}</span>
                </div>
            </div>

            {/* Gap warnings */}
            {gaps.length > 0 && (
                <div className="space-y-1">
                    {gaps.map((gap, i) => (
                        <div key={i} className="text-xs text-amber-400 flex items-center gap-1">
                            <span>&#9888;</span>
                            Gap: {formatTime(gap.start)} - {formatTime(gap.end)} ({Math.round(gap.duration)}s no spawns)
                        </div>
                    ))}
                </div>
            )}

            {/* Top enemy types */}
            <div className="flex flex-wrap gap-1">
                {Object.entries(stats.enemyTypeDistribution)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 6)
                    .map(([type, count]) => (
                        <span key={type} className="text-xs px-1.5 py-0.5 bg-white/10 rounded text-white/70">
                            {type.replace(/_/g, ' ')}: {count as number}
                        </span>
                    ))
                }
            </div>
        </div>
    )
})

const TimelineEventTimeline = memo(function TimelineEventTimeline({ timeline, formatTime }: { timeline: TimelineEvent[], formatTime: (s: number) => string }) {
    if (!timeline || timeline.length === 0) return null

    const maxTime = useMemo(() => Math.max(...timeline.map(e => e.time), 1), [timeline])
    const maxCount = useMemo(() => Math.max(...timeline.map(e => e.count), 1), [timeline])

    const phases = useMemo(() => {
        // Group events into phases (separated by >= 10s gaps or messages)
        const phasesResult: { start: number, end: number, events: TimelineEvent[] }[] = []
        let currentPhase = { start: 0, end: 0, events: [] as TimelineEvent[] }

        timeline.forEach((event, i) => {
            const prevTime = i > 0 ? timeline[i - 1].time : event.time
            const gap = event.time - prevTime

            if (gap >= 10 && currentPhase.events.length > 0) {
                phasesResult.push(currentPhase)
                currentPhase = { start: event.time, end: event.time, events: [event] }
            } else {
                currentPhase.events.push(event)
            }
            currentPhase.end = event.time
        })
        if (currentPhase.events.length > 0) {
            phasesResult.push(currentPhase)
        }
        return phasesResult
    }, [timeline])

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Event Timeline</div>

            {/* Phase separators with phase numbers */}
            <div className="space-y-1.5">
                {phases.map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="space-y-1">
                        {phaseIdx > 0 && (
                            <div className="flex items-center gap-2 py-0.5">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
                                <span className="text-xs text-purple-400/50 font-mono whitespace-nowrap">Phase {phaseIdx + 1}</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
                            </div>
                        )}

                        <div className="flex items-end gap-1 h-12 bg-white/5 rounded-lg p-2 overflow-x-auto">
                            {phase.events.map((event, i) => {
                                const xPos = (event.time / maxTime) * 100
                                const heightPct = Math.max(30, (event.count / maxCount) * 80)
                                let barColor = 'bg-purple-500'
                                let borderColor = 'border-purple-400'

                                if (event.isBoss) {
                                    barColor = 'bg-red-600'
                                    borderColor = 'border-red-400'
                                } else if (event.isElite) {
                                    barColor = 'bg-yellow-500'
                                    borderColor = 'border-yellow-400'
                                }

                                return (
                                    <div
                                        key={i}
                                        className={`flex-shrink-0 rounded-t border-b-2 ${barColor} ${borderColor} hover:opacity-100 opacity-70 transition-opacity cursor-default group relative`}
                                        style={{ height: `${heightPct}%`, minWidth: '8px', maxWidth: '24px' }}
                                        title={`${formatTime(event.time)}: ${event.count}x ${event.enemyType}${event.isElite ? ' (Elite)' : ''}${event.isBoss ? ' (Boss)' : ''}`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="font-mono">{formatTime(event.time)}</div>
                                            <div>{event.count}x {event.enemyType.replace(/_/g, ' ')}</div>
                                            {(event.isElite || event.isBoss) && (
                                                <div className={`text-xs ${event.isBoss ? 'text-red-300' : 'text-yellow-300'}`}>
                                                    {event.isBoss ? '★ BOSS' : '★ Elite'}
                                                </div>
                                            )}
                                            {event.message && <div className="text-white/70 italic text-xs">"{event.message}"</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Time markers for this phase */}
                        <div className="flex justify-between text-xs text-white/30 font-mono px-2">
                            <span>{formatTime(phase.start)}</span>
                            <span>{formatTime(phase.end)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
})

const LevelAnalysisDisplay = memo(function LevelAnalysisDisplay({ level }: { level: CustomLevelData }) {
    const { analyzeLevel } = require('@/lib/level-automation')
    const analysis = useMemo(() => analyzeLevel(level), [level.timeline?.length, level.availableEnemies?.length])

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-yellow-400'
        if (score >= 40) return 'text-amber-400'
        return 'text-red-400'
    }

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/20'
        if (score >= 60) return 'bg-yellow-500/20'
        if (score >= 40) return 'bg-amber-500/20'
        return 'bg-red-500/20'
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Level Quality Analysis</div>

            {/* Overall Score */}
            <div className={`p-3 rounded-lg border border-white/10 ${getScoreBg(analysis.overall)}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 font-bold">Overall Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.overall)}`}>
                        {analysis.overall}
                    </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                        className={`h-full transition-all ${getScoreColor(analysis.overall).replace('text-', 'bg-')}`}
                        style={{ width: `${analysis.overall}%` }}
                    />
                </div>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-2 gap-2">
                {/* Pacing */}
                <div className={`p-2 rounded-lg border border-white/10 ${getScoreBg(analysis.pacing.score)}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70 font-bold">Pacing</span>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.pacing.score)}`}>
                            {analysis.pacing.score}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {analysis.pacing.notes.map((note, i) => (
                            <div key={i} className="text-xs text-white/50">{note}</div>
                        ))}
                    </div>
                </div>

                {/* Variety */}
                <div className={`p-2 rounded-lg border border-white/10 ${getScoreBg(analysis.variety.score)}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70 font-bold">Variety</span>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.variety.score)}`}>
                            {analysis.variety.score}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {analysis.variety.notes.map((note, i) => (
                            <div key={i} className="text-xs text-white/50">{note}</div>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className={`p-2 rounded-lg border border-white/10 ${getScoreBg(analysis.difficulty.score)}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70 font-bold">Difficulty</span>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.difficulty.score)}`}>
                            {analysis.difficulty.score}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {analysis.difficulty.notes.map((note, i) => (
                            <div key={i} className="text-xs text-white/50">{note}</div>
                        ))}
                    </div>
                </div>

                {/* Structure */}
                <div className={`p-2 rounded-lg border border-white/10 ${getScoreBg(analysis.structure.score)}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70 font-bold">Structure</span>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.structure.score)}`}>
                            {analysis.structure.score}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {analysis.structure.notes.map((note, i) => (
                            <div key={i} className="text-xs text-white/50">{note}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-xs text-white/40 italic">
                Scores update automatically as you modify timeline events. Aim for 80+ overall for balanced gameplay.
            </div>
        </div>
    )
})

const TimelineEventCard = memo(function TimelineEventCard({ event, index, isEditing, isSelected, enemyTypes, onToggleSelect, onEdit, onSave, onCancel, onDelete, onDuplicate, formatTime }: {
    event: TimelineEvent
    index: number
    isEditing: boolean
    isSelected?: boolean
    enemyTypes: string[]
    onToggleSelect?: () => void
    onEdit: () => void
    onSave: (event: TimelineEvent) => void
    onCancel: () => void
    onDelete: () => void
    onDuplicate: () => void
    formatTime: (sec: number) => string
}) {
    const [editedEvent, setEditedEvent] = useState(event)

    useEffect(() => {
        setEditedEvent(event)
    }, [event, isEditing])

    if (isEditing) {
        return (
            <div className="bg-blue-600/10 border border-blue-400/40 rounded-lg p-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Time (sec)</label>
                        <input
                            type="number"
                            value={editedEvent.time}
                            onChange={(e) => setEditedEvent({ ...editedEvent, time: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Count</label>
                        <input
                            type="number"
                            value={editedEvent.count}
                            onChange={(e) => setEditedEvent({ ...editedEvent, count: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Enemy Type</label>
                    <select
                        value={editedEvent.enemyType}
                        onChange={(e) => setEditedEvent({ ...editedEvent, enemyType: e.target.value })}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                        {enemyTypes.map(type => (
                            <option key={type} value={type}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={editedEvent.isElite}
                            onChange={(e) => setEditedEvent({ ...editedEvent, isElite: e.target.checked })}
                            className="rounded"
                        />
                        Elite
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={editedEvent.isBoss}
                            onChange={(e) => setEditedEvent({ ...editedEvent, isBoss: e.target.checked })}
                            className="rounded"
                        />
                        Boss
                    </label>
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Message</label>
                    <input
                        type="text"
                        value={editedEvent.message || ''}
                        onChange={(e) => setEditedEvent({ ...editedEvent, message: e.target.value })}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    />
                </div>
                <div className="flex gap-1">
                    <Button size="sm" onClick={() => onSave(editedEvent)} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Check className="w-3 h-3 mr-1" />
                        Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 border-white/20">
                        Cancel
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`flex items-center gap-2 p-2 border rounded-lg hover:bg-white/10 transition-colors group ${isSelected ? 'bg-cyan-600/15 border-cyan-400/30' : 'bg-white/5 border-white/10'}`}
        >
            {onToggleSelect && (
                <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={onToggleSelect}
                    className="rounded shrink-0"
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-300 font-bold">{formatTime(event.time)}</span>
                    <span className="text-xs text-white/90">
                        {event.count}x {event.enemyType}
                    </span>
                    {event.isElite && <span className="text-xs text-yellow-400">★Elite</span>}
                    {event.isBoss && <span className="text-xs text-red-400">★Boss</span>}
                </div>
                {event.message && (
                    <div className="text-xs text-white/50 mt-0.5 italic truncate">"{event.message}"</div>
                )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEdit}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                >
                    <Edit className="w-3 h-3" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDuplicate}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                >
                    <Copy className="w-3 h-3" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    )
})

// Meshes Tab
function MeshesTab({ level, onUpdate }: { level: CustomLevelData, onUpdate: (level: CustomLevelData) => void }) {
    const [selectedMeshType, setSelectedMeshType] = useState<string>('rock')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [meshPreview, setMeshPreview] = useState({
        scale: 1.0,
        rotation: 0,
        hasCollision: true,
        isStatic: true
    })

    const filteredMeshTypes = selectedCategory === 'all' 
        ? MESH_TYPES 
        : MESH_TYPES.filter(m => m.category === selectedCategory)

    const placeMesh = () => {
        const newMesh: MeshPlacement = {
            id: `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            meshType: selectedMeshType,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: meshPreview.rotation * Math.PI / 180, z: 0 },
            scale: { x: meshPreview.scale, y: meshPreview.scale, z: meshPreview.scale },
            isStatic: meshPreview.isStatic,
            hasCollision: meshPreview.hasCollision
        }

        const meshPlacements = [...(level.meshPlacements || []), newMesh]
        onUpdate({ ...level, meshPlacements })
    }

    const deleteMesh = (meshId: string) => {
        const meshPlacements = (level.meshPlacements || []).filter(m => m.id !== meshId)
        onUpdate({ ...level, meshPlacements })
    }

    return (
        <div className="p-4 space-y-3">
            {/* Mesh Type Selection */}
            <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">Add Mesh</div>

                <div className="flex gap-2 mb-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                        <option value="all">All Categories</option>
                        {MESH_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-white/60 mb-1 block">Mesh Type</label>
                    <select
                        value={selectedMeshType}
                        onChange={(e) => setSelectedMeshType(e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                        {filteredMeshTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name} - {type.description}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-white/60 mb-1 block">Scale: {meshPreview.scale.toFixed(1)}x</label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={meshPreview.scale}
                        onChange={(e) => setMeshPreview({ ...meshPreview, scale: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="text-xs text-white/60 mb-1 block">Rotation: {meshPreview.rotation}°</label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={meshPreview.rotation}
                        onChange={(e) => setMeshPreview({ ...meshPreview, rotation: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={meshPreview.hasCollision}
                            onChange={(e) => setMeshPreview({ ...meshPreview, hasCollision: e.target.checked })}
                            className="rounded"
                        />
                        Collision
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-white/80">
                        <input
                            type="checkbox"
                            checked={meshPreview.isStatic}
                            onChange={(e) => setMeshPreview({ ...meshPreview, isStatic: e.target.checked })}
                            className="rounded"
                        />
                        Static
                    </label>
                </div>

                <Button
                    size="sm"
                    onClick={placeMesh}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add {selectedMeshType} at origin
                </Button>

                <div className="text-xs text-white/40 italic">
                    Use Visual Editor to position meshes precisely
                </div>
            </div>

            {/* Placed Meshes List */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-white/60 uppercase tracking-wider font-bold">
                        Placed Meshes ({level.meshPlacements?.length || 0})
                    </div>
                    {level.meshPlacements && level.meshPlacements.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdate({ ...level, meshPlacements: [] })}
                            className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {(!level.meshPlacements || level.meshPlacements.length === 0) ? (
                    <div className="text-center py-8 text-white/40 text-xs">
                        No meshes placed yet. Add your first mesh above.
                    </div>
                ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {level.meshPlacements.map((mesh) => (
                            <div
                                key={mesh.id}
                                className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                                <Box className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white/90 font-medium">{mesh.meshType}</div>
                                    <div className="text-xs text-white/50">
                                        Scale: {mesh.scale.x.toFixed(1)}x • Rot: {(mesh.rotation.y * 180 / Math.PI).toFixed(0)}°
                                        {mesh.hasCollision && ' • Collision'}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteMesh(mesh.id)}
                                    className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

// Paint Tab
function PaintTab({ level, onUpdate }: { level: CustomLevelData, onUpdate: (level: CustomLevelData) => void }) {
    const [paintMode, setPaintMode] = useState<'scatter' | 'color'>('scatter')
    const [scatterSettings, setScatterSettings] = useState({
        meshType: 'grass',
        density: 50,
        areaSize: 10
    })
    const [colorSettings, setColorSettings] = useState({
        color: '#4a7c3e',
        areaSize: 10
    })

    const scatterMeshTypes = [
        { id: 'grass', name: 'Grass Clumps' },
        { id: 'flowers', name: 'Flowers' },
        { id: 'stones', name: 'Small Stones' },
        { id: 'mushrooms', name: 'Mushrooms' },
        { id: 'debris', name: 'Debris' },
        { id: 'foliage', name: 'Foliage' }
    ]

    const addPaintArea = () => {
        const newArea: PaintedArea = {
            id: `paint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: paintMode,
            points: [
                { x: -scatterSettings.areaSize / 2, y: -scatterSettings.areaSize / 2 },
                { x: scatterSettings.areaSize / 2, y: -scatterSettings.areaSize / 2 },
                { x: scatterSettings.areaSize / 2, y: scatterSettings.areaSize / 2 },
                { x: -scatterSettings.areaSize / 2, y: scatterSettings.areaSize / 2 }
            ],
            ...(paintMode === 'scatter' ? {
                meshType: scatterSettings.meshType,
                density: scatterSettings.density
            } : {
                color: colorSettings.color
            })
        }

        const paintedAreas = [...(level.paintedAreas || []), newArea]
        onUpdate({ ...level, paintedAreas })
    }

    const deletePaintArea = (areaId: string) => {
        const paintedAreas = (level.paintedAreas || []).filter(a => a.id !== areaId)
        onUpdate({ ...level, paintedAreas })
    }

    return (
        <div className="p-4 space-y-3">
            {/* Paint Mode Selection */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setPaintMode('scatter')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        paintMode === 'scatter'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                >
                    Scatter Meshes
                </button>
                <button
                    onClick={() => setPaintMode('color')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        paintMode === 'color'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                >
                    Color Paint
                </button>
            </div>

            {/* Scatter Settings */}
            {paintMode === 'scatter' && (
                <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                    <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">Scatter Paint</div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Mesh Type</label>
                        <select
                            value={scatterSettings.meshType}
                            onChange={(e) => setScatterSettings({ ...scatterSettings, meshType: e.target.value })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                        >
                            {scatterMeshTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Density: {scatterSettings.density}%</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={scatterSettings.density}
                            onChange={(e) => setScatterSettings({ ...scatterSettings, density: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Area Size: {scatterSettings.areaSize}m</label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={scatterSettings.areaSize}
                            onChange={(e) => setScatterSettings({ ...scatterSettings, areaSize: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <Button
                        size="sm"
                        onClick={addPaintArea}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Scatter Area
                    </Button>
                </div>
            )}

            {/* Color Paint Settings */}
            {paintMode === 'color' && (
                <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                    <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">Color Paint</div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Color</label>
                        <input
                            type="color"
                            value={colorSettings.color}
                            onChange={(e) => setColorSettings({ ...colorSettings, color: e.target.value })}
                            className="w-full h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Area Size: {colorSettings.areaSize}m</label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={colorSettings.areaSize}
                            onChange={(e) => setColorSettings({ ...colorSettings, areaSize: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <Button
                        size="sm"
                        onClick={addPaintArea}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Color Area
                    </Button>
                </div>
            )}

            <div className="text-xs text-white/40 italic px-3">
                Use Visual Editor to paint areas by clicking/dragging on the map
            </div>

            {/* Painted Areas List */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-white/60 uppercase tracking-wider font-bold">
                        Paint Areas ({level.paintedAreas?.length || 0})
                    </div>
                    {level.paintedAreas && level.paintedAreas.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdate({ ...level, paintedAreas: [] })}
                            className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {(!level.paintedAreas || level.paintedAreas.length === 0) ? (
                    <div className="text-center py-8 text-white/40 text-xs">
                        No paint areas yet. Add your first area above.
                    </div>
                ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {level.paintedAreas.map((area) => (
                            <div
                                key={area.id}
                                className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                                <Palette className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white/90 font-medium">
                                        {area.type === 'scatter' ? `Scatter: ${area.meshType}` : 'Color Paint'}
                                    </div>
                                    <div className="text-xs text-white/50">
                                        {area.type === 'scatter'
                                            ? `Density: ${area.density}%`
                                            : `Color: ${area.color}`
                                        }
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deletePaintArea(area.id)}
                                    className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Settings Tab
function SettingsTab({ level, onUpdate }: { level: CustomLevelData, onUpdate: (level: CustomLevelData) => void }) {
    return (
        <div className="p-4 space-y-4 max-h-[calc(85vh-200px)] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Basic Info</div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Level Name</label>
                    <input
                        type="text"
                        value={level.name}
                        onChange={(e) => onUpdate({ ...level, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Description</label>
                    <textarea
                        value={level.description}
                        onChange={(e) => onUpdate({ ...level, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        rows={2}
                    />
                </div>
            </div>

            {/* Gameplay Settings */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Gameplay</div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Max Level</label>
                        <input
                            type="number"
                            value={level.maxLevel}
                            onChange={(e) => onUpdate({ ...level, maxLevel: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Difficulty</label>
                        <input
                            type="number"
                            step="0.1"
                            value={level.difficultyMultiplier}
                            onChange={(e) => onUpdate({ ...level, difficultyMultiplier: parseFloat(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Win Condition</label>
                        <select
                            value={level.winCondition}
                            onChange={(e) => onUpdate({ ...level, winCondition: e.target.value as 'level' | 'time' | 'kills' })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        >
                            <option value="level">Reach Level</option>
                            <option value="time">Survive Time</option>
                            <option value="kills">Kill Count</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Win Value</label>
                        <input
                            type="number"
                            value={level.winValue}
                            onChange={(e) => onUpdate({ ...level, winValue: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <input
                        type="checkbox"
                        id="disableBackgroundSpawning"
                        checked={level.disableBackgroundSpawning ?? false}
                        onChange={(e) => onUpdate({ ...level, disableBackgroundSpawning: e.target.checked })}
                        className="w-4 h-4 accent-purple-500"
                    />
                    <label htmlFor="disableBackgroundSpawning" className="text-xs text-white/80 flex-1">
                        <div className="font-bold">Timeline-Only Spawning</div>
                        <div className="text-white/50 mt-0.5">
                            Disable automatic background spawning. Only timeline events will spawn enemies.
                            (Recommended for custom levels with precise spawn control)
                        </div>
                    </label>
                </div>
            </div>

            {/* Theme Settings */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Theme</div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Sky Color</label>
                    <input
                        type="color"
                        value={`#${level.theme.skyColor.toString(16).padStart(6, '0')}`}
                        onChange={(e) => {
                            const color = parseInt(e.target.value.substring(1), 16)
                            onUpdate({
                                ...level,
                                theme: { ...level.theme, skyColor: color }
                            })
                        }}
                        className="w-full h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                    />
                </div>

                <div>
                    <label className="text-xs text-white/60 mb-1 block">Ground Color</label>
                    <input
                        type="color"
                        value={`#${level.theme.groundColor.toString(16).padStart(6, '0')}`}
                        onChange={(e) => {
                            const color = parseInt(e.target.value.substring(1), 16)
                            onUpdate({
                                ...level,
                                theme: { ...level.theme, groundColor: color }
                            })
                        }}
                        className="w-full h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                    />
                </div>
            </div>

            {/* Border Settings */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">World Border</div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Border Type</label>
                        <select
                            value={level.borderConfig?.type || 'rock'}
                            onChange={(e) => onUpdate({
                                ...level,
                                borderConfig: {
                                    ...level.borderConfig,
                                    type: e.target.value as 'rock' | 'tree' | 'none',
                                    size: level.borderConfig?.size || 100
                                }
                            })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        >
                            <option value="rock">Rock Wall</option>
                            <option value="tree">Tree Line</option>
                            <option value="none">No Border</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/60 mb-1 block">World Size</label>
                        <input
                            type="number"
                            value={level.borderConfig?.size || 100}
                            onChange={(e) => onUpdate({
                                ...level,
                                borderConfig: {
                                    type: level.borderConfig?.type || 'rock',
                                    size: parseInt(e.target.value) || 100
                                }
                            })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Available Enemies */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Available Enemies</div>
                <div className="text-xs text-white/60">
                    Enemies available for spawning (separate by comma):
                </div>
                <input
                    type="text"
                    value={level.availableEnemies.join(', ')}
                    onChange={(e) => onUpdate({
                        ...level,
                        availableEnemies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-mono"
                    placeholder="drifter, screecher, bruiser"
                />
            </div>

            {/* Loot Theme */}
            <div className="space-y-3">
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Loot & Rewards</div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Loot Theme Name</label>
                    <input
                        type="text"
                        value={level.lootThemeName}
                        onChange={(e) => onUpdate({ ...level, lootThemeName: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        placeholder="CUSTOM LOOT"
                    />
                </div>
            </div>
        </div>
    )
}

// Pattern Templates Component
function PatternTemplates({ level, onAddPattern, enemyTypes }: {
    level: CustomLevelData
    onAddPattern: (timeline: TimelineEvent[]) => void
    enemyTypes: string[]
}) {
    const [showPatterns, setShowPatterns] = useState(false)
    const [patternParams, setPatternParams] = useState({
        waveCount: 5,
        waveTime: 0,
        waveSize: 10,
        waveEnemy: enemyTypes[0] || 'drifter',
        recurringStartTime: 0,
        recurringInterval: 10,
        recurringDuration: 60,
        recurringSize: 5,
        rampStartTime: 0,
        rampStartCount: 3,
        rampEndCount: 20,
        rampDuration: 120,
        bossTime: 60,
        bossMessage: 'Boss approaching...'
    })

    const generateWavePattern = () => {
        const timeline = level.timeline || []
        const newEvent: TimelineEvent = {
            time: patternParams.waveTime,
            enemyType: patternParams.waveEnemy,
            count: patternParams.waveCount,
            isElite: false,
            isBoss: false,
            message: ''
        }
        onAddPattern([...timeline, newEvent].sort((a, b) => a.time - b.time))
        setShowPatterns(false)
    }

    const generateRecurringPattern = () => {
        const timeline = level.timeline || []
        const newEvents: TimelineEvent[] = []
        for (let t = patternParams.recurringStartTime; t <= patternParams.recurringStartTime + patternParams.recurringDuration; t += patternParams.recurringInterval) {
            newEvents.push({
                time: t,
                enemyType: patternParams.waveEnemy,
                count: patternParams.recurringSize,
                isElite: false,
                isBoss: false,
                message: ''
            })
        }
        onAddPattern([...timeline, ...newEvents].sort((a, b) => a.time - b.time))
        setShowPatterns(false)
    }

    const generateRampPattern = () => {
        const timeline = level.timeline || []
        const newEvents: TimelineEvent[] = []
        const steps = Math.max(1, Math.floor(patternParams.rampDuration / 10))
        const countPerStep = (patternParams.rampEndCount - patternParams.rampStartCount) / steps

        for (let i = 0; i <= steps; i++) {
            const count = Math.round(patternParams.rampStartCount + countPerStep * i)
            const time = patternParams.rampStartTime + (i / steps) * patternParams.rampDuration
            newEvents.push({
                time,
                enemyType: patternParams.waveEnemy,
                count: Math.max(1, count),
                isElite: false,
                isBoss: false,
                message: ''
            })
        }
        onAddPattern([...timeline, ...newEvents].sort((a, b) => a.time - b.time))
        setShowPatterns(false)
    }

    const generateBossPhase = () => {
        const timeline = level.timeline || []
        const newEvents: TimelineEvent[] = [
            {
                time: patternParams.bossTime,
                enemyType: patternParams.waveEnemy,
                count: 1,
                isElite: true,
                isBoss: true,
                message: patternParams.bossMessage
            }
        ]
        onAddPattern([...timeline, ...newEvents].sort((a, b) => a.time - b.time))
        setShowPatterns(false)
    }

    return (
        <div className="bg-indigo-600/10 border border-indigo-400/20 rounded-lg p-2">
            <button
                onClick={() => setShowPatterns(!showPatterns)}
                className="text-xs text-indigo-300 font-bold uppercase tracking-wider w-full text-left"
            >
                {showPatterns ? '▼' : '▶'} Quick Pattern Templates
            </button>

            {showPatterns && (
                <div className="mt-3 space-y-3">
                    {/* Wave */}
                    <div className="bg-white/5 border border-white/10 rounded p-2 space-y-2">
                        <div className="text-xs text-white/70 font-bold">Single Wave</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Time (s)</label>
                                <input
                                    type="number"
                                    value={patternParams.waveTime}
                                    onChange={(e) => setPatternParams({ ...patternParams, waveTime: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Count</label>
                                <input
                                    type="number"
                                    value={patternParams.waveCount}
                                    onChange={(e) => setPatternParams({ ...patternParams, waveCount: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Type</label>
                                <select
                                    value={patternParams.waveEnemy}
                                    onChange={(e) => setPatternParams({ ...patternParams, waveEnemy: e.target.value })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                >
                                    {enemyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={generateWavePattern}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                            Add Wave
                        </Button>
                    </div>

                    {/* Recurring */}
                    <div className="bg-white/5 border border-white/10 rounded p-2 space-y-2">
                        <div className="text-xs text-white/70 font-bold">Recurring Spawns</div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Start Time (s)</label>
                            <input
                                type="number"
                                value={patternParams.recurringStartTime}
                                onChange={(e) => setPatternParams({ ...patternParams, recurringStartTime: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Interval (s)</label>
                                <input
                                    type="number"
                                    value={patternParams.recurringInterval}
                                    onChange={(e) => setPatternParams({ ...patternParams, recurringInterval: parseFloat(e.target.value) || 1 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Duration (s)</label>
                                <input
                                    type="number"
                                    value={patternParams.recurringDuration}
                                    onChange={(e) => setPatternParams({ ...patternParams, recurringDuration: parseFloat(e.target.value) || 10 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Count per wave</label>
                            <input
                                type="number"
                                value={patternParams.recurringSize}
                                onChange={(e) => setPatternParams({ ...patternParams, recurringSize: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={generateRecurringPattern}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                            Add Recurring Pattern
                        </Button>
                    </div>

                    {/* Ramp */}
                    <div className="bg-white/5 border border-white/10 rounded p-2 space-y-2">
                        <div className="text-xs text-white/70 font-bold">Difficulty Ramp</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Start Count</label>
                                <input
                                    type="number"
                                    value={patternParams.rampStartCount}
                                    onChange={(e) => setPatternParams({ ...patternParams, rampStartCount: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">End Count</label>
                                <input
                                    type="number"
                                    value={patternParams.rampEndCount}
                                    onChange={(e) => setPatternParams({ ...patternParams, rampEndCount: parseInt(e.target.value) || 10 })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Duration (s)</label>
                            <input
                                type="number"
                                value={patternParams.rampDuration}
                                onChange={(e) => setPatternParams({ ...patternParams, rampDuration: parseFloat(e.target.value) || 60 })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={generateRampPattern}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                            Add Ramp Pattern
                        </Button>
                    </div>

                    {/* Boss */}
                    <div className="bg-white/5 border border-white/10 rounded p-2 space-y-2">
                        <div className="text-xs text-white/70 font-bold">Boss Phase</div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Time (s)</label>
                            <input
                                type="number"
                                value={patternParams.bossTime}
                                onChange={(e) => setPatternParams({ ...patternParams, bossTime: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Message</label>
                            <input
                                type="text"
                                value={patternParams.bossMessage}
                                onChange={(e) => setPatternParams({ ...patternParams, bossMessage: e.target.value })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                placeholder="e.g., 'Boss approaching...'"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={generateBossPhase}
                            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                            Add Boss
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
