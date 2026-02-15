
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const MINT2_DIR = path.join(process.cwd(), 'mint2');
const CACHE_FILE = path.join(process.cwd(), 'mint2_cache.json');

if (!process.env.CLOUDINARY_URL) {
    console.error('Error: CLOUDINARY_URL not found in environment variables.');
    process.exit(1);
}

// Log masked config for debugging
const url = process.env.CLOUDINARY_URL;
console.log(`Cloudinary URL found: ${url.substring(0, 20)}...`);

interface Cache {
    [filename: string]: string;
}

// Helper to sanitize cache file if needed
function loadCache(): Cache {
    if (!fs.existsSync(CACHE_FILE)) return {};

    try {
        const data = fs.readFileSync(CACHE_FILE, 'utf-8');
        // Basic check for obvious corruption (e.g., cut off JSON)
        if (!data.trim().endsWith('}')) {
            console.warn('Cache file appears incomplete. Attempting to recover valid JSON...');
            // very basic recovery attempt: find the last closing brace
            const lastBrace = data.lastIndexOf('}');
            if (lastBrace > 0) {
                return JSON.parse(data.substring(0, lastBrace + 1));
            }
            return {};
        }
        return JSON.parse(data);
    } catch (e) {
        console.warn('Warning: Could not parse existing cache file. Starting fresh.');
        return {};
    }
}

async function uploadFile(filePath: string, filename: string, resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto') {
    try {
        // Check if file still exists before uploading
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found, skipping: ${filename}`);
            return null;
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'mint2',
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            resource_type: resourceType,
            timeout: 60000,
        });

        console.log(`Uploaded ${filename}: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error(`Failed to upload ${filename}:`, error);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(MINT2_DIR)) {
        console.error('Error: mint2 directory not found.');
        process.exit(1);
    }

    /* 
      If the process was interrupted, the JSON file might be corrupted (e.g. half-written).
      We try to load it safely.
    */
    let cache = loadCache();
    console.log(`Loaded existing cache with ${Object.keys(cache).length} entries.`);

    const files = fs.readdirSync(MINT2_DIR);
    let uploadCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    console.log(`Found ${files.length} files in ${MINT2_DIR}`);

    // Sort files so we have deterministic order
    files.sort();

    for (const file of files) {
        const fullPath = path.join(MINT2_DIR, file);

        // Validations
        if (file.startsWith('.') ||
            file.endsWith('.zip') ||
            !fs.existsSync(fullPath) ||
            fs.lstatSync(fullPath).isDirectory()) {
            continue;
        }

        const isGlb = file.toLowerCase().endsWith('.glb');
        const resourceType = isGlb ? 'raw' : 'image';

        if (cache[file]) {
            if (cache[file].startsWith('http')) {
                // If it's a GLB but cached as image/upload, we MUST re-upload
                if (isGlb && cache[file].includes('/image/upload/')) {
                    console.log(`Re-uploading ${file} to fix resource type...`);
                } else {
                    skipCount++;
                    continue;
                }
            }
        }

        console.log(`Uploading ${file} as ${resourceType}...`);
        const url = await uploadFile(fullPath, file, resourceType);

        if (url) {
            cache[file] = url;
            uploadCount++;
            // Save cache incrementally
            try {
                fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
            } catch (e) {
                console.error('Error saving cache file:', e);
            }
        } else {
            errorCount++;
        }
    }

    console.log(`\nUpload complete.`);
    console.log(`Skipped (already cached): ${skipCount}`);
    console.log(`Uploaded: ${uploadCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Cache saved to ${CACHE_FILE}`);
}

main().catch(console.error);
