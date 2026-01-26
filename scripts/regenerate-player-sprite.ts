import fs from 'fs'
import path from 'path'

const API_KEY = 'rdpk-d2ddab1afb2a01bb2a6c325b321ae347'
const API_URL = 'https://api.retrodiffusion.ai/v1/inferences'

async function regeneratePlayerSprite() {
  console.log('Regenerating player sprite with transparent background...')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RD-Token': API_KEY
    },
    body: JSON.stringify({
      prompt: 'Slavic gopnik character wearing blue tracksuit and ushanka hat, transparent background, top-down view, pixel art, retro game character sprite',
      width: 64,
      height: 64,
      prompt_style: 'animation__any_animation',
      num_images: 1,
      return_spritesheet: true,
      background_color: 'transparent',
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

    const outputPath = 'public/sprites/player/player_sheet.png'
    fs.writeFileSync(outputPath, buffer)
    console.log(`✓ Regenerated player sprite (${data.credit_cost || 0} credits)`)
    console.log('Refresh the game to see the new sprite!')
  } else {
    throw new Error(`Failed to generate sprite: ${JSON.stringify(data)}`)
  }
}

regeneratePlayerSprite().catch(console.error)
