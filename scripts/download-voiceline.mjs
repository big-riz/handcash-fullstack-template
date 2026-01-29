import https from 'https';
import fs from 'fs';
import path from 'path';

const url = process.argv[2];
const outputPath = process.argv[3];

if (!url || !outputPath) {
    console.error('Usage: node download-voiceline.mjs <url> <outputPath>');
    process.exit(1);
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

download(url, outputPath)
    .then(() => console.log('Downloaded:', outputPath))
    .catch(err => console.error('Error:', err.message));
