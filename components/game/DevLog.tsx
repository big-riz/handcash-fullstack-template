"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, FileText, Plus, Wrench, Minus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DevLogEntry {
    date: string
    type: "ADD" | "FIX" | "REM" | "UPD"
    message: string
}

const TYPE_CONFIG = {
    ADD: { icon: Plus, color: "text-green-400", bg: "bg-green-400/10", label: "Addition" },
    FIX: { icon: Wrench, color: "text-blue-400", bg: "bg-blue-400/10", label: "Fix" },
    REM: { icon: Minus, color: "text-red-400", bg: "bg-red-400/10", label: "Removal" },
    UPD: { icon: RefreshCw, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Update" },
}

function parseDevLog(content: string): DevLogEntry[] {
    const lines = content.split("\n")
    const entries: DevLogEntry[] = []

    for (const line of lines) {
        // Match format: [YYYY-MM-DD] [TYPE] Message
        const match = line.match(/^\[(\d{4}-\d{2}-\d{2})\]\s*\[(ADD|FIX|REM|UPD)\]\s*(.+)$/)
        if (match) {
            entries.push({
                date: match[1],
                type: match[2] as DevLogEntry["type"],
                message: match[3].trim(),
            })
        }
    }

    // Return most recent first
    return entries.reverse()
}

export function DevLog() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [entries, setEntries] = useState<DevLogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchDevLog() {
            try {
                const response = await fetch("/api/devlog")
                if (response.ok) {
                    const data = await response.json()
                    setEntries(parseDevLog(data.content))
                }
            } catch (error) {
                console.error("Failed to load devlog:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDevLog()
    }, [])

    const displayedEntries = isExpanded ? entries : entries.slice(0, 5)

    return (
        <div className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Dev Log</span>
                    <span className="text-xs text-white/40 font-mono">({entries.length} entries)</span>
                </div>
                {entries.length > 5 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                <span className="text-xs">Show Less</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                <span className="text-xs">Show All</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className={`overflow-y-auto transition-all duration-300 ${isExpanded ? "max-h-[400px]" : "max-h-[220px]"}`}>
                {isLoading ? (
                    <div className="p-4 text-center text-white/40 text-sm">Loading...</div>
                ) : entries.length === 0 ? (
                    <div className="p-4 text-center text-white/40 text-sm">No devlog entries yet</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {displayedEntries.map((entry, index) => {
                            const config = TYPE_CONFIG[entry.type]
                            const Icon = config.icon
                            return (
                                <div key={index} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.bg}`}>
                                        <Icon className={`w-3 h-3 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white/90 leading-tight">{entry.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-white/40 font-mono">{entry.date}</span>
                                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
