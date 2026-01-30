import { useState, useEffect } from "react"

export interface GameReplay {
  id: number
  userId: string
  playerName: string
  handle?: string
  avatarUrl?: string
  finalLevel: number
  finalTime: number
  gameVersion: string
  characterId?: string
  worldId?: string
  createdAt: string
}

export function useGameReplays(handle?: string, limit: number = 10) {
  const [replays, setReplays] = useState<GameReplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReplays = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (handle) params.append("handle", handle)
      params.append("limit", limit.toString())

      const response = await fetch(`/api/replays?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch replays")
      }

      const data = await response.json()
      setReplays(data || [])
    } catch (err: any) {
      console.error("[useGameReplays] Fetch error:", err)
      setError(err.message || "Failed to load replays")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReplays()
  }, [handle, limit])

  return {
    replays,
    isLoading,
    error,
    refresh: fetchReplays,
  }
}