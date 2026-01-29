/**
 * AirdropIndicator.tsx
 *
 * Shows edge-of-screen arrows pointing to active airdrops.
 * Displays countdown timer while falling.
 * Uses pulsing yellow/orange animation.
 */

import React, { useMemo } from 'react'

interface AirdropData {
    x: number
    z: number
    fallTimer: number
    isFalling: boolean
}

interface AirdropIndicatorProps {
    airdrops: AirdropData[]
    playerX: number
    playerZ: number
    screenWidth: number
    screenHeight: number
    cameraZoom?: number
}

export function AirdropIndicator({
    airdrops,
    playerX,
    playerZ,
    screenWidth,
    screenHeight,
    cameraZoom = 1.0
}: AirdropIndicatorProps) {
    const indicators = useMemo(() => {
        const result: Array<{
            x: number
            y: number
            angle: number
            distance: number
            fallTimer: number
            isFalling: boolean
            isOnScreen: boolean
        }> = []

        // Viewport bounds (units visible on screen based on orthographic camera)
        const viewportUnits = 24 / cameraZoom // frustumSize from useGameEngine
        const halfViewX = (viewportUnits * (screenWidth / screenHeight)) / 2
        const halfViewZ = viewportUnits / 2

        for (const airdrop of airdrops) {
            const dx = airdrop.x - playerX
            const dz = airdrop.z - playerZ
            const distance = Math.sqrt(dx * dx + dz * dz)
            const angle = Math.atan2(dx, -dz) // Angle from player, camera is looking -Z

            // Check if airdrop is within visible area
            const isOnScreen = Math.abs(dx) < halfViewX && Math.abs(dz) < halfViewZ

            if (isOnScreen) {
                // Don't show indicator for on-screen airdrops
                continue
            }

            // Calculate screen edge position
            const screenCenterX = screenWidth / 2
            const screenCenterY = screenHeight / 2

            // Direction in screen space (flip Z for screen coords)
            const screenDirX = dx
            const screenDirY = dz

            // Normalize
            const len = Math.sqrt(screenDirX * screenDirX + screenDirY * screenDirY)
            const normX = screenDirX / len
            const normY = screenDirY / len

            // Find intersection with screen edge
            const margin = 60
            const edgeX = screenCenterX + normX * (screenWidth / 2 - margin)
            const edgeY = screenCenterY + normY * (screenHeight / 2 - margin)

            // Clamp to screen bounds
            const clampedX = Math.max(margin, Math.min(screenWidth - margin, edgeX))
            const clampedY = Math.max(margin, Math.min(screenHeight - margin, edgeY))

            result.push({
                x: clampedX,
                y: clampedY,
                angle,
                distance,
                fallTimer: airdrop.fallTimer,
                isFalling: airdrop.isFalling,
                isOnScreen
            })
        }

        return result
    }, [airdrops, playerX, playerZ, screenWidth, screenHeight, cameraZoom])

    if (indicators.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-30">
            {indicators.map((indicator, index) => (
                <div
                    key={index}
                    className="absolute"
                    style={{
                        left: indicator.x,
                        top: indicator.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {/* Arrow pointing to airdrop */}
                    <div
                        className="relative animate-pulse"
                        style={{
                            transform: `rotate(${indicator.angle}rad)`
                        }}
                    >
                        {/* Arrow shape */}
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            className="drop-shadow-lg"
                        >
                            <defs>
                                <linearGradient id="airdropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#FFA500" />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <path
                                d="M24 8 L36 28 L28 28 L28 40 L20 40 L20 28 L12 28 Z"
                                fill="url(#airdropGradient)"
                                stroke="#8B4513"
                                strokeWidth="2"
                                filter="url(#glow)"
                            />
                        </svg>
                    </div>

                    {/* Timer or "SUPPLY!" label */}
                    <div
                        className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                            px-2 py-1 rounded bg-black/70 text-sm font-bold"
                        style={{
                            color: indicator.isFalling ? '#FFD700' : '#00FF00',
                            textShadow: `0 0 8px ${indicator.isFalling ? '#FFD700' : '#00FF00'}`
                        }}
                    >
                        {indicator.isFalling
                            ? `${Math.ceil(indicator.fallTimer)}s`
                            : '📦 SUPPLY!'
                        }
                    </div>

                    {/* Distance indicator */}
                    <div
                        className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap
                            text-xs text-gray-300"
                    >
                        {Math.round(indicator.distance)}m
                    </div>
                </div>
            ))}
        </div>
    )
}
