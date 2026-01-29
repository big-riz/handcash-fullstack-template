import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const timelineDir = path.join(__dirname, '..', 'public/audio/voicelines/timeline');

// Read the mapping file
const mapping = JSON.parse(fs.readFileSync(path.join(timelineDir, 'voicelines-mapping.json'), 'utf-8'));

// World configuration: index ranges and prefixes
// Index 1 was wrong voice (deleted), index 2 starts correct voicelines
// Dark Forest: 31 voicelines (indices 2-32)
// Catacombs: 41 voicelines (indices 33-73)
// Frozen Waste: 60 voicelines (indices 74-133)

const worlds = [
    { prefix: 'df', startIndex: 2, count: 31 },
    { prefix: 'cat', startIndex: 33, count: 41 },
    { prefix: 'fw', startIndex: 74, count: 60 },
];

let totalRenamed = 0;

for (const world of worlds) {
    console.log(`\nProcessing ${world.prefix} voicelines...`);

    for (let i = 0; i < world.count; i++) {
        const mappingIndex = world.startIndex + i;
        const voicelineNum = i + 1;
        const newFilename = `${world.prefix}-${String(voicelineNum).padStart(3, '0')}.mp3`;

        // Find the mapping entry
        const entry = mapping.find(m => m.index === mappingIndex);
        if (!entry) {
            console.log(`  Warning: No mapping found for index ${mappingIndex}`);
            continue;
        }

        const oldPath = path.join(timelineDir, entry.filename);
        const newPath = path.join(timelineDir, newFilename);

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`  ${entry.filename} -> ${newFilename}`);
            totalRenamed++;
        } else {
            console.log(`  Warning: File not found: ${entry.filename}`);
        }
    }
}

console.log(`\nRenamed ${totalRenamed} files.`);
