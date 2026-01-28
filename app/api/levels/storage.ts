import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'custom-levels.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadLevels(): any[] {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const data = fs.readFileSync(FILE_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[Storage] Failed to load levels:', error);
    }
    return [];
}

function saveLevels(levels: any[]) {
    try {
        ensureDataDir();
        fs.writeFileSync(FILE_PATH, JSON.stringify(levels, null, 2));
    } catch (error) {
        console.error('[Storage] Failed to save levels:', error);
    }
}

export function saveLevel(level: any) {
    const levels = loadLevels();
    const existingIndex = levels.findIndex((l: any) => l.id === level.id);
    
    if (existingIndex >= 0) {
        levels[existingIndex] = level;
    } else {
        levels.push(level);
    }
    
    saveLevels(levels);
    return level;
}

export function getLevel(id: string) {
    const levels = loadLevels();
    return levels.find((l: any) => l.id === id);
}

export function deleteLevel(id: string) {
    let levels = loadLevels();
    levels = levels.filter((l: any) => l.id !== id);
    saveLevels(levels);
}

export function getAllLevels() {
    return loadLevels();
}