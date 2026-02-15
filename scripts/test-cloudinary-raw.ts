
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

async function testUpload() {
    const filePath = path.join(process.cwd(), 'mint2', 'samogon_still.glb');
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'mint2',
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            resource_type: 'raw',
        });
        fs.writeFileSync('test_upload_result.txt', result.secure_url);
        console.log('Saved to test_upload_result.txt');
    } catch (e) {
        console.error('Upload failed:', e);
    }
}

testUpload();
