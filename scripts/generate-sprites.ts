import fs from 'fs'
import path from 'path'

const API_KEY = process.env.RETRO_DIFFUSION_API_KEY || 'rdpk-d2ddab1afb2a01bb2a6c325b321ae347'
const API_URL = 'https://api.retrodiffusion.ai/v1/inferences'

interface SpriteRequest {
  entityId: string
  prompt: string
  width: number
  height: number
  style: string
  outputPath: string
}

async function generateSprite(request: SpriteRequest): Promise<void> {
  console.log(`Generating ${request.entityId}...`)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RD-Token': API_KEY
    },
    body: JSON.stringify({
      prompt: request.prompt,
      width: request.width,
      height: request.height,
      prompt_style: request.style,
      num_images: 1,
      return_spritesheet: true,
      seed: Math.floor(Math.random() * 1000000)
    })
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.base64_images && data.base64_images.length > 0) {
    const base64Data = data.base64_images[0].replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const dir = path.dirname(request.outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(request.outputPath, buffer)
    console.log(`✓ Generated ${request.entityId} sprite (${data.credit_cost || 0} credits)`)
  } else {
    throw new Error(`Failed to generate ${request.entityId}: ${JSON.stringify(data)}`)
  }
}

async function generateAllSprites() {
  const sprites: SpriteRequest[] = [
    // Player (64x64 animation)
    {
      entityId: 'player',
      prompt: 'Slavic gopnik character wearing blue tracksuit and ushanka hat, top-down view, pixel art, retro game character sprite',
      width: 64,
      height: 64,
      style: 'animation__any_animation',
      outputPath: 'public/sprites/player/player_sheet.png'
    },

    // Enemies (48x48 walking animations)
    {
      entityId: 'drifter',
      prompt: 'zombie ghost enemy, pale ghostly appearance, floating spirit, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/drifter_sheet.png'
    },
    {
      entityId: 'bruiser',
      prompt: 'large brutish red muscular enemy, aggressive monster, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/bruiser_sheet.png'
    },
    {
      entityId: 'screecher',
      prompt: 'orange flying creature with wings, bird-like enemy, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/screecher_sheet.png'
    },
    {
      entityId: 'zmora',
      prompt: 'ethereal blue ghost spirit, translucent, floating, Slavic folklore creature, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/zmora_sheet.png'
    },
    {
      entityId: 'domovoi',
      prompt: 'small house spirit creature, brown furry goblin-like, Slavic folklore, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/domovoi_sheet.png'
    },
    {
      entityId: 'kikimora',
      prompt: 'swamp witch creature, green grotesque female spirit, Slavic folklore, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/kikimora_sheet.png'
    },
    {
      entityId: 'leshy',
      prompt: 'forest guardian spirit, tree-like humanoid with branches, Slavic folklore, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/leshy_sheet.png'
    },
    {
      entityId: 'werewolf',
      prompt: 'werewolf beast, gray fur, wolf-man hybrid monster, aggressive, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/werewolf_sheet.png'
    },
    {
      entityId: 'forest_wraith',
      prompt: 'dark forest wraith, shadowy hooded figure, dark green ethereal spirit, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/forest_wraith_sheet.png'
    },
    {
      entityId: 'guardian_golem',
      prompt: 'stone guardian golem, large rocky humanoid, ancient protector, top-down view, pixel art sprite',
      width: 48,
      height: 48,
      style: 'animation__walking_and_idle',
      outputPath: 'public/sprites/enemies/guardian_golem_sheet.png'
    }
  ]

  console.log('Starting sprite generation...')
  console.log(`Using API key: ${API_KEY.substring(0, 10)}...`)

  for (const sprite of sprites) {
    try {
      await generateSprite(sprite)
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`✗ Failed to generate ${sprite.entityId}:`, error)
    }
  }

  console.log('\nSprite generation complete!')
  console.log('Next steps:')
  console.log('1. Run: npx tsx scripts/generate-shadow.ts')
  console.log('2. Review generated sprites in public/sprites/')
  console.log('3. Enable sprite mode in game by setting useSpriteMode = true')
}

generateAllSprites().catch(console.error)
