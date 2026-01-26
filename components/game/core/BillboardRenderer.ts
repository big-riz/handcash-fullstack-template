import * as THREE from 'three'

/**
 * BillboardSprite - Container for sprite and shadow mesh
 */
export interface BillboardSprite {
  sprite: THREE.Sprite
  shadow: THREE.Mesh
  material: THREE.SpriteMaterial
  currentFrame: number
}

/**
 * SpriteConfig - Configuration for creating a billboard sprite
 */
export interface SpriteRenderConfig {
  texture: THREE.Texture
  frameWidth: number
  frameHeight: number
  framesPerRow: number
  scale: number
  shadowRadius: number
  shadowTexture?: THREE.Texture
}

/**
 * BillboardRenderer - Creates and updates billboard sprites with shadows
 */
export class BillboardRenderer {
  private shadowTexture: THREE.Texture | null = null

  /**
   * Set the shadow texture to use for all sprites
   */
  setShadowTexture(texture: THREE.Texture): void {
    this.shadowTexture = texture
  }

  /**
   * Create a billboard sprite with shadow
   */
  createBillboard(config: SpriteRenderConfig): BillboardSprite {
    // Create sprite material with custom shader for chroma key (remove white background)
    const material = new THREE.SpriteMaterial({
      map: config.texture,
      transparent: true,
      alphaTest: 0.01,
      color: 0xffffff,
      sizeAttenuation: false,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    })

    // Enable alpha testing to remove near-white pixels
    if (material.map) {
      material.map.needsUpdate = true
    }

    // Set initial UV coordinates to show first frame (frame 0)
    if (material.map) {
      const image = config.texture.image as HTMLImageElement
      const textureWidth = image.width
      const textureHeight = image.height
      const uSize = config.frameWidth / textureWidth
      const vSize = config.frameHeight / textureHeight

      material.map.repeat.set(uSize, -vSize) // Negative vSize to flip vertically
      material.map.offset.set(0, 1) // Start at top-left, offset to bottom
    }

    // Create sprite
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(config.scale, config.scale, 1)

    // Create shadow
    const shadow = this.createShadow(config.shadowRadius, config.shadowTexture || this.shadowTexture)

    return {
      sprite,
      shadow,
      material,
      currentFrame: 0
    }
  }

  /**
   * Update billboard sprite orientation and frame
   */
  updateBillboard(
    billboardSprite: BillboardSprite,
    frame: number,
    config: SpriteRenderConfig,
    position: THREE.Vector3,
    cameraPos: THREE.Vector3
  ): void {
    const { sprite, shadow, material } = billboardSprite

    // Update UV coordinates for current frame
    if (frame !== billboardSprite.currentFrame) {
      this.updateSpriteFrame(material, frame, config)
      billboardSprite.currentFrame = frame
    }

    // Billboard rotation - always face camera on Y-axis only
    const dx = cameraPos.x - position.x
    const dz = cameraPos.z - position.z
    sprite.material.rotation = Math.atan2(dx, dz)

    // Update sprite position
    sprite.position.copy(position)

    // Update shadow position and scale
    shadow.position.set(position.x, 0.01, position.z)

    // Dynamic shadow scaling based on sprite height
    const spriteHeight = position.y
    const shadowScale = Math.max(0.5, 1.0 - spriteHeight * 0.1)
    shadow.scale.set(
      config.shadowRadius * shadowScale,
      config.shadowRadius * shadowScale,
      1
    )

    // Fade shadow at distance
    const distanceToCamera = position.distanceTo(cameraPos)
    const shadowMaterial = shadow.material as THREE.MeshBasicMaterial
    shadowMaterial.opacity = Math.max(0.2, 1.0 - distanceToCamera * 0.01)

    // Update render order for proper depth sorting
    sprite.renderOrder = -distanceToCamera
    shadow.renderOrder = sprite.renderOrder - 1
  }

  /**
   * Update sprite UV coordinates to display a specific frame
   */
  private updateSpriteFrame(
    material: THREE.SpriteMaterial,
    frame: number,
    config: SpriteRenderConfig
  ): void {
    const { frameWidth, frameHeight, framesPerRow, texture } = config

    // Calculate texture dimensions
    const image = texture.image as HTMLImageElement
    const textureWidth = image.width
    const textureHeight = image.height

    // Calculate frame position in grid
    const col = frame % framesPerRow
    const row = Math.floor(frame / framesPerRow)

    // Calculate UV coordinates with vertical flip
    const u = (col * frameWidth) / textureWidth
    const v = 1 - (row * frameHeight) / textureHeight
    const uSize = frameWidth / textureWidth
    const vSize = frameHeight / textureHeight

    // Update texture repeat and offset
    if (material.map) {
      material.map.repeat.set(uSize, -vSize) // Negative vSize to flip vertically
      material.map.offset.set(u, v)
    }
  }

  /**
   * Create a shadow mesh
   */
  createShadow(radius: number, shadowTexture: THREE.Texture | null = null): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(radius, 16)

    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      map: shadowTexture
    })

    const shadow = new THREE.Mesh(geometry, material)
    shadow.rotation.x = -Math.PI / 2 // Lay flat on ground
    shadow.position.y = 0.01 // Slightly above ground to prevent z-fighting

    return shadow
  }
}
