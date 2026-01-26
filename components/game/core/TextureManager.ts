import * as THREE from 'three'

/**
 * TextureManager - Handles loading and caching of sprite sheet textures
 */
export class TextureManager {
  private loader: THREE.TextureLoader
  private cache: Map<string, THREE.Texture>

  constructor() {
    this.loader = new THREE.TextureLoader()
    this.cache = new Map()
  }

  /**
   * Load a sprite sheet texture from a path
   * @param id Unique identifier for this texture
   * @param path Path to the texture file (e.g., "/sprites/player/player_sheet.png")
   * @returns Promise resolving to the loaded texture
   */
  async loadSpriteSheet(id: string, path: string): Promise<THREE.Texture> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (texture) => {
          // Configure texture for pixel art (crisp rendering)
          texture.magFilter = THREE.NearestFilter
          texture.minFilter = THREE.NearestFilter
          texture.generateMipmaps = false
          texture.format = THREE.RGBAFormat
          texture.premultiplyAlpha = false
          texture.colorSpace = THREE.SRGBColorSpace

          this.cache.set(id, texture)
          resolve(texture)
        },
        undefined,
        (error) => {
          console.error(`Failed to load sprite sheet: ${id} at ${path}`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * Get a cached sprite sheet texture
   * @param id Unique identifier for the texture
   * @returns The cached texture or null if not found
   */
  getSpriteSheet(id: string): THREE.Texture | null {
    return this.cache.get(id) || null
  }

  /**
   * Preload multiple sprite sheets
   * @param configs Array of {id, path} objects
   * @returns Promise that resolves when all textures are loaded
   */
  async preloadAssets(configs: Array<{ id: string; path: string }>): Promise<void> {
    const promises = configs.map(config =>
      this.loadSpriteSheet(config.id, config.path)
    )

    await Promise.all(promises)
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    this.cache.forEach(texture => texture.dispose())
    this.cache.clear()
  }
}
