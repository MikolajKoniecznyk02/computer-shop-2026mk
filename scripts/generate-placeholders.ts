import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const items = { cpu: '#2563eb', gpu: '#15803d', ram: '#b45309', disk: '#7c3aed' };

async function main() {
    const dir = path.join(process.cwd(), 'public', 'images', 'products');
    mkdirSync(dir, { recursive: true });
    for (const [name, color] of Object.entries(items)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" fill="${color}"/>
      <text x="200" y="225" font-size="90" font-family="sans-serif" text-anchor="middle" fill="#fff">${name.toUpperCase()}</text>
    </svg>`;
        await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(path.join(dir, `${name}.webp`));
    }
    console.log('Wygenerowano obrazki w', dir);
}
main();