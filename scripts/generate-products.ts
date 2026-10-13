import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SEED = 20261001;
const COUNT = 100;
const TYPES = ['cpu', 'gpu', 'ram', 'disk'] as const;

function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rand = mulberry32(SEED);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)];

const CATALOG = {
    cpu: { brands: ['Intel', 'AMD'], series: ['Core i5', 'Core i7', 'Core i9', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], price: [60000, 250000], desc: 'Procesor do komputerów stacjonarnych.' },
    gpu: { brands: ['NVIDIA', 'AMD', 'Intel'], series: ['GeForce RTX', 'Radeon RX', 'Arc'], price: [120000, 850000], desc: 'Karta graficzna do gier i pracy z grafiką.' },
    ram: { brands: ['Kingston', 'Corsair', 'G.Skill'], series: ['Fury', 'Vengeance', 'Ripjaws'], price: [15000, 90000], desc: 'Pamięć operacyjna DDR5.' },
    disk: { brands: ['Samsung', 'WD', 'Crucial'], series: ['Evo', 'Black', 'P3'], price: [20000, 120000], desc: 'Dysk SSD NVMe.' },
} as const;

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const usedCodes = new Set<string>();
function makeCode(): string {
    for (; ;) {
        let c = '';
        for (let i = 0; i < 10; i++) c += CODE_CHARS[int(0, CODE_CHARS.length - 1)];
        if (!usedCodes.has(c)) {
            usedCodes.add(c);
            return c;
        }
    }
}

const BASE = Date.UTC(2026, 9, 1, 10, 0, 0);

const products = Array.from({ length: COUNT }, (_, idx) => {
    const id = idx + 1;
    const type = TYPES[idx % TYPES.length]; // gwarantuje wszystkie kategorie
    const c = CATALOG[type];
    const ms = BASE - int(0, 365) * 86_400_000 - int(0, 23) * 3_600_000;
    return {
        id,
        code: makeCode(),
        name: `${pick(c.brands)} ${pick(c.series)} ${int(1000, 9999)}`,
        type,
        price: int(c.price[0], c.price[1]),                // grosze
        amount: id % 9 === 0 ? 0 : int(1, 50),             // co 9. produkt niedostępny
        description: c.desc,
        date: new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        image: `/images/products/${type}.png`,
    };
});

const out = path.join(process.cwd(), 'data', 'products.json');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(products, null, 2) + '\n');
console.log(`Zapisano ${products.length} produktów do ${out}`);