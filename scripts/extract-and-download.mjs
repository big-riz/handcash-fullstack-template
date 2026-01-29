import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const content = fs.readFileSync(path.join(projectRoot, 'conv.txt'), 'utf-8');

// Find all text + URL pairs
const entries = [];

// Pattern to find text and URL pairs - looking for successful generations only
const blockPattern = /text:\s*"([^"]+)"[^⎿]*?⎿\s*Success\.\s*Audio URL:\s*(https:\/\/minimax[^\s]+)/g;

// First, normalize the content by removing line breaks within entries
const normalizedContent = content.replace(/\r?\n\s+/g, '');

let match;
while ((match = blockPattern.exec(normalizedContent)) !== null) {
    const text = match[1];
    let url = match[2];

    // Clean URL - extract just the URL part
    url = url.replace(/^.*?(https:\/\/)/, 'https://');

    entries.push({ text, url });
}

console.log(`Found ${entries.length} voiceline entries`);

// Create output directory
const outputDir = path.join(projectRoot, 'public/audio/voicelines/timeline');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Generate safe filename from text
function textToFilename(text, index) {
    const safe = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
    return `voiceline-${String(index + 1).padStart(3, '0')}-${safe}.mp3`;
}

// Download function
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Download all files
async function downloadAll() {
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const filename = textToFilename(entry.text, i);
        const filepath = path.join(outputDir, filename);

        console.log(`[${i + 1}/${entries.length}] Downloading: ${filename}`);
        console.log(`  Text: "${entry.text.slice(0, 60)}..."`);

        try {
            await downloadFile(entry.url, filepath);
            console.log(`  ✓ Saved`);
        } catch (err) {
            console.log(`  ✗ Error: ${err.message}`);
        }
    }
}

// Also output a JSON mapping file
const mapping = entries.map((e, i) => ({
    index: i + 1,
    text: e.text,
    filename: textToFilename(e.text, i),
    url: e.url
}));

fs.writeFileSync(
    path.join(outputDir, 'voicelines-mapping.json'),
    JSON.stringify(mapping, null, 2)
);

console.log('\nSaved voicelines-mapping.json');
console.log('\nStarting downloads...\n');

downloadAll().then(() => {
    console.log('\nDone!');
});
