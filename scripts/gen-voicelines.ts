// Run with: npx tsx scripts/gen-voicelines.ts
// Generates timeline voicelines using MiniMax TTS API

import { darkForestVoicelines, catacombsVoicelines, frozenWasteVoicelines } from '../components/game/data/timeline_voicelines';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const OUTPUT_DIR = path.join(__dirname, '../public/audio/voicelines/timeline');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const allVoicelines = [
    ...darkForestVoicelines,
    ...catacombsVoicelines,
    ...frozenWasteVoicelines,
];

console.log(`Total voicelines to generate: ${allVoicelines.length}`);
console.log(`Output directory: ${OUTPUT_DIR}`);
console.log('\nTo generate these voicelines, use the MiniMax TTS tool with:');
console.log('Voice ID: Russian_AttractiveGuy');
console.log('\nVoicelines list:');

allVoicelines.forEach((v, i) => {
    const exists = fs.existsSync(path.join(OUTPUT_DIR, v.file));
    console.log(`${i + 1}. [${exists ? 'EXISTS' : 'MISSING'}] ${v.file}: "${v.text}"`);
});

const missing = allVoicelines.filter(v => !fs.existsSync(path.join(OUTPUT_DIR, v.file)));
console.log(`\nMissing: ${missing.length} / ${allVoicelines.length}`);
