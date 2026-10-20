import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { validateProducts } from '../lib/products/schema';
import { importCatalog } from './imports';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const raw = JSON.parse(await readFile(path.join(process.cwd(), 'data', 'products.json'), 'utf-8'));
        const products = validateProducts(raw); // cały plik zwalidowany PRZED jakimkolwiek zapisem
        await importCatalog(prisma, products);
        console.log(`Seed OK: 4 kategorie, ${products.length} produktów`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('Seed nie powiódł się:', err);
    process.exitCode = 1;
});