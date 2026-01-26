import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

function generateShadow() {
  console.log('Generating shadow sprite...')

  // Create 64x64 canvas
  const canvas = createCanvas(64, 64)
  const ctx = canvas.getContext('2d')

  // Create radial gradient for soft shadow
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)')
  gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)

  // Save to file
  const outputPath = path.join('public', 'sprites', 'shadows', 'blob_shadow.png')
  const dir = path.dirname(outputPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(outputPath, buffer)

  console.log(`✓ Generated shadow sprite at ${outputPath}`)
}

generateShadow()
