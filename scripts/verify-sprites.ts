import fs from 'fs'
import path from 'path'

console.log('🎨 Sprite System Verification\n')

// Check if all required sprite files exist
const requiredSprites = [
  'public/sprites/player/player_sheet.png',
  'public/sprites/enemies/drifter_sheet.png',
  'public/sprites/enemies/bruiser_sheet.png',
  'public/sprites/enemies/screecher_sheet.png',
  'public/sprites/enemies/zmora_sheet.png',
  'public/sprites/enemies/domovoi_sheet.png',
  'public/sprites/enemies/kikimora_sheet.png',
  'public/sprites/enemies/leshy_sheet.png',
  'public/sprites/enemies/werewolf_sheet.png',
  'public/sprites/enemies/forest_wraith_sheet.png',
  'public/sprites/enemies/guardian_golem_sheet.png',
  'public/sprites/shadows/blob_shadow.png'
]

let allPresent = true
let totalSize = 0

console.log('📁 Checking sprite assets...\n')

for (const sprite of requiredSprites) {
  const fullPath = path.join(process.cwd(), sprite)
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    totalSize += stats.size
    console.log(`✅ ${sprite.split('/').pop()} (${sizeKB} KB)`)
  } else {
    console.log(`❌ MISSING: ${sprite}`)
    allPresent = false
  }
}

console.log(`\n📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)

// Check if core system files exist
const coreFiles = [
  'components/game/core/TextureManager.ts',
  'components/game/core/AnimationController.ts',
  'components/game/core/BillboardRenderer.ts',
  'components/game/core/SpriteSystem.ts',
  'components/game/data/sprites.ts'
]

console.log('\n📦 Checking core system files...\n')

let allCorePresent = true
for (const file of coreFiles) {
  const fullPath = path.join(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file.split('/').pop()}`)
  } else {
    console.log(`❌ MISSING: ${file}`)
    allCorePresent = false
  }
}

// Summary
console.log('\n' + '='.repeat(50))
if (allPresent && allCorePresent) {
  console.log('✅ Sprite system fully installed and ready!')
  console.log('\n🎮 Next steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Navigate to the game')
  console.log('3. Sprites are enabled by default')
  console.log('4. Check FPS counter for performance')
  console.log('\n📖 See SPRITE_SYSTEM_README.md for details')
} else {
  console.log('❌ Sprite system incomplete!')
  console.log('\n🔧 To fix:')
  if (!allPresent) {
    console.log('1. Run: npx tsx scripts/generate-sprites.ts')
    console.log('2. Run: npx tsx scripts/generate-shadow.ts')
  }
  if (!allCorePresent) {
    console.log('3. Check implementation - core files missing')
  }
}
console.log('='.repeat(50))
