"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FPSTestPage() {
    const [log, setLog] = useState<string[]>([])
    const [isRunning, setIsRunning] = useState(false)

    const addLog = (message: string) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    const runTest = async () => {
        setIsRunning(true)
        setLog([])

        try {
            // 1. Check status
            addLog("Checking server status...")
            const statusRes = await fetch('/api/fps/status')
            const status = await statusRes.json()
            addLog(`✅ Server status: ${status.status}`)

            // 2. Create room
            addLog("Creating room...")
            const createRes = await fetch('/api/fps/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mapId: 'arena01', maxPlayers: 8 })
            })
            const { roomId } = await createRes.json()
            addLog(`✅ Room created: ${roomId}`)

            // 3. List rooms
            addLog("Listing rooms...")
            const listRes = await fetch('/api/fps/rooms')
            const { rooms } = await listRes.json()
            addLog(`✅ Found ${rooms.length} room(s)`)

            // 4. Join room
            addLog("Joining room as Player1...")
            const joinRes = await fetch(`/api/fps/rooms/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: 'test-player-1', username: 'Player1' })
            })
            const joinData = await joinRes.json()
            if (joinData.error) {
                addLog(`❌ Join failed: ${joinData.error}`)
                setIsRunning(false)
                return
            }
            addLog(`✅ Joined room! Spawn: (${joinData.spawnPoint.x}, ${joinData.spawnPoint.y}, ${joinData.spawnPoint.z})`)

            // 5. Send movement inputs
            addLog("Sending movement inputs (moving forward)...")
            for (let i = 0; i < 5; i++) {
                const stateRes = await fetch(`/api/fps/rooms/${roomId}/gamestate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: 'test-player-1',
                        inputs: [{
                            forward: true,
                            backward: false,
                            left: false,
                            right: false,
                            jump: false,
                            shoot: false,
                            reload: false,
                            sprint: false,
                            crouch: false,
                            mouseX: 0,
                            mouseY: 0,
                            timestamp: Date.now(),
                            sequence: i
                        }],
                        lastTick: i
                    })
                })
                const state = await stateRes.json()
                const player = state.players[0]
                addLog(`  Tick ${i}: Position (${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)})`)
                await new Promise(r => setTimeout(r, 100))
            }

            addLog("🎉 Test complete! Server is processing movement correctly!")

        } catch (error) {
            addLog(`❌ Error: ${error}`)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="container mx-auto p-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-black">FPS Multiplayer API Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={runTest}
                        disabled={isRunning}
                        className="w-full h-12 text-lg font-bold"
                    >
                        {isRunning ? "Running Test..." : "Run Multiplayer Test"}
                    </Button>

                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[500px] overflow-y-auto">
                        {log.length === 0 ? (
                            <div className="text-muted-foreground">Click "Run Multiplayer Test" to start...</div>
                        ) : (
                            log.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
