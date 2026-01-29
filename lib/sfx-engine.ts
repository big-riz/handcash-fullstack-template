/**
 * SFX Engine API Client
 * https://sfxengine.com
 *
 * Generates AI sound effects from text prompts.
 * Cost: 1 credit per SFX, 3 credits per song
 */

const BASE_URL = 'https://api.sfxengine.com/v1'

interface SFXEngineConfig {
  apiKey: string
}

interface CreateSoundEffectParams {
  /** Text description of the sound effect */
  prompt: string
  /** Duration in seconds (max 47) */
  length?: number
  /** Start time offset in seconds */
  secondsToStart?: number
  /** Make publicly visible */
  isPublic?: boolean
  /** Webhook URL for completion notification */
  webhookUrl?: string
}

interface CreateSongParams {
  /** Text description of the song */
  prompt: string
}

interface SoundEffect {
  id: string
  prompt: string
  status: 'processing' | 'generated' | 'failed'
  url: string
  length: number
  fileSize: number
  isPublic: boolean
  imageUrl: string | null
  userId: string
  createdAt: string
}

interface Song {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioUrl?: string
  createdAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

class SFXEngineClient {
  private apiKey: string

  constructor(config: SFXEngineConfig) {
    this.apiKey = config.apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': '*/*',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SFX Engine API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ============ Sound Effects ============

  /**
   * Create a new sound effect from a text prompt
   * Cost: 1 credit
   */
  async createSoundEffect(params: CreateSoundEffectParams): Promise<SoundEffect> {
    return this.request<SoundEffect>('/sound-effect', {
      method: 'POST',
      body: JSON.stringify({
        prompt: params.prompt,
        length: params.length ?? 1,
        secondsToStart: params.secondsToStart ?? 0,
        isPublic: params.isPublic ?? false,
        webhookUrl: params.webhookUrl ?? '',
      }),
    })
  }

  /**
   * Get a specific sound effect by ID
   */
  async getSoundEffect(id: string): Promise<SoundEffect> {
    return this.request<SoundEffect>(`/sound-effect/${id}`)
  }

  /**
   * List all sound effects with pagination
   */
  async listSoundEffects(
    page = 0,
    limit = 25
  ): Promise<PaginatedResponse<SoundEffect>> {
    return this.request<PaginatedResponse<SoundEffect>>(
      `/sound-effect?page=${page}&limit=${limit}`
    )
  }

  /**
   * Poll for sound effect completion
   */
  async waitForSoundEffect(
    id: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<SoundEffect> {
    for (let i = 0; i < maxAttempts; i++) {
      const sfx = await this.getSoundEffect(id)
      if (sfx.status === 'generated') return sfx
      if (sfx.status === 'failed') throw new Error(`Sound effect generation failed: ${id}`)
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
    throw new Error(`Sound effect generation timed out: ${id}`)
  }

  // ============ Songs ============

  /**
   * Create a new song from a text prompt
   * Cost: 3 credits
   */
  async createSong(params: CreateSongParams): Promise<Song> {
    return this.request<Song>('/song', {
      method: 'POST',
      body: JSON.stringify({
        prompt: params.prompt,
      }),
    })
  }

  /**
   * Get a specific song by ID
   */
  async getSong(id: string): Promise<Song> {
    return this.request<Song>(`/song/${id}`)
  }

  /**
   * List all songs with pagination
   */
  async listSongs(page = 0, limit = 25): Promise<PaginatedResponse<Song>> {
    return this.request<PaginatedResponse<Song>>(
      `/song?page=${page}&limit=${limit}`
    )
  }

  /**
   * Poll for song completion
   */
  async waitForSong(
    id: string,
    maxAttempts = 120,
    intervalMs = 3000
  ): Promise<Song> {
    for (let i = 0; i < maxAttempts; i++) {
      const song = await this.getSong(id)
      if (song.status === 'completed') return song
      if (song.status === 'failed') throw new Error(`Song generation failed: ${id}`)
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
    throw new Error(`Song generation timed out: ${id}`)
  }

  // ============ Utilities ============

  /**
   * Generate and download a sound effect
   */
  async generateAndDownload(
    prompt: string,
    outputPath: string,
    length = 1
  ): Promise<string> {
    const sfx = await this.createSoundEffect({ prompt, length })
    const completed = await this.waitForSoundEffect(sfx.id)

    if (!completed.url) {
      throw new Error('No audio URL in completed sound effect')
    }

    // Download the audio file
    const audioResponse = await fetch(completed.url)
    const buffer = await audioResponse.arrayBuffer()

    // In Node.js environment
    if (typeof window === 'undefined') {
      const fs = await import('fs/promises')
      await fs.writeFile(outputPath, Buffer.from(buffer))
    }

    return completed.url
  }
}

// Singleton instance - set API key via environment variable
let instance: SFXEngineClient | null = null

export function getSFXEngine(): SFXEngineClient {
  if (!instance) {
    const apiKey = process.env.SFX_ENGINE_API_KEY
    if (!apiKey) {
      throw new Error('SFX_ENGINE_API_KEY environment variable not set')
    }
    instance = new SFXEngineClient({ apiKey })
  }
  return instance
}

export function createSFXEngine(apiKey: string): SFXEngineClient {
  return new SFXEngineClient({ apiKey })
}

export { SFXEngineClient }
export type {
  SFXEngineConfig,
  CreateSoundEffectParams,
  CreateSongParams,
  SoundEffect,
  Song,
  PaginatedResponse
}
