import * as THREE from 'three'
import { TextureManager } from './TextureManager'
import { AnimationController } from './AnimationController'
import { BillboardRenderer, BillboardSprite } from './BillboardRenderer'
import { SpriteConfig, SPRITE_CONFIGS } from '../data/sprites'

/**
 * EntitySprite - Complete sprite entity with animation
 */
export interface EntitySprite {
  sprite: BillboardSprite
  animator: AnimationController
  config: SpriteConfig
}

/**
 * SpriteSystem - Main coordinator for sprite rendering
 * Singleton pattern for global access
 */
export class SpriteSystem {
  private static instance: SpriteSystem | null = null

  private textureManager: TextureManager
  private renderer: BillboardRenderer
  private scene: THREE.Scene | null = null
  private entityConfigs: Map<string, SpriteConfig>
  private initialized: boolean = false

  private constructor() {
    this.textureManager = new TextureManager()
    this.renderer = new BillboardRenderer()
    this.entityConfigs = new Map()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SpriteSystem {
    if (!SpriteSystem.instance) {
      SpriteSystem.instance = new SpriteSystem()
    }
    return SpriteSystem.instance
  }

  /**
   * Initialize the sprite system
   * @param scene THREE.Scene to add sprites to
   */
  async initialize(scene: THREE.Scene): Promise<void> {
    if (this.initialized) {
      console.warn('SpriteSystem already initialized')
      return
    }

    this.scene = scene

    // Register all sprite configs
    Object.values(SPRITE_CONFIGS).forEach(config => {
      this.registerEntityType(config.id, config)
    })

    // Preload all sprite sheets
    const assetConfigs = Object.values(SPRITE_CONFIGS).map(config => ({
      id: config.id,
      path: config.spriteSheet
    }))

    try {
      await this.textureManager.preloadAssets(assetConfigs)
      console.log(`✓ Loaded ${assetConfigs.length} sprite sheets`)

      // Load shadow texture
      await this.textureManager.loadSpriteSheet('shadow', '/sprites/shadows/blob_shadow.png')
      const shadowTexture = this.textureManager.getSpriteSheet('shadow')
      if (shadowTexture) {
        this.renderer.setShadowTexture(shadowTexture)
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize SpriteSystem:', error)
      throw error
    }
  }

  /**
   * Register an entity type with its sprite configuration
   */
  registerEntityType(type: string, config: SpriteConfig): void {
    this.entityConfigs.set(type, config)
  }

  /**
   * Create a new entity sprite
   * @param type Entity type (must be registered)
   * @returns EntitySprite instance
   */
  createEntity(type: string): EntitySprite {
    if (!this.initialized) {
      throw new Error('SpriteSystem not initialized. Call initialize() first.')
    }

    const config = this.entityConfigs.get(type)
    if (!config) {
      throw new Error(`Entity type "${type}" not registered`)
    }

    const texture = this.textureManager.getSpriteSheet(config.id)
    if (!texture) {
      throw new Error(`Texture not loaded for entity type "${type}"`)
    }

    // Create billboard sprite
    const sprite = this.renderer.createBillboard({
      texture,
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
      framesPerRow: config.framesPerRow,
      scale: config.scale,
      shadowRadius: config.shadowRadius
    })

    // Create animation controller
    const animator = new AnimationController(config.animations, 'idle')

    return {
      sprite,
      animator,
      config
    }
  }

  /**
   * Update entity sprite animation and position
   */
  updateEntity(
    entitySprite: EntitySprite,
    state: string,
    position: THREE.Vector3,
    cameraPos: THREE.Vector3,
    deltaTime: number
  ): void {
    const { sprite, animator, config } = entitySprite

    // Update animation state
    animator.setState(state)
    const currentFrame = animator.update(deltaTime)

    // Get texture for UV update
    const texture = this.textureManager.getSpriteSheet(config.id)
    if (!texture) return

    // Update billboard
    this.renderer.updateBillboard(
      sprite,
      currentFrame,
      {
        texture,
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight,
        framesPerRow: config.framesPerRow,
        scale: config.scale,
        shadowRadius: config.shadowRadius
      },
      position,
      cameraPos
    )
  }

  /**
   * Release entity sprite (for object pooling)
   */
  releaseEntity(entitySprite: EntitySprite): void {
    if (!this.scene) return

    // Remove from scene
    this.scene.remove(entitySprite.sprite.sprite)
    this.scene.remove(entitySprite.sprite.shadow)
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.textureManager.clear()
    this.initialized = false
    this.scene = null
  }
}
