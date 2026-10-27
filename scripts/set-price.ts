import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { parseProductId } from '../lib/products/id';

async function main() {
    const [idArg = '', priceArg = ''] = process.argv.slice(2);
    const id = parseProductId(idArg);
    if (id === null) throw new Error(`Niepoprawne id: "${idArg}"`);
    if (!/^(0|[1-9][0-9]*)$/.test(priceArg) || Number(priceArg) > 2147483647) {
        throw new Error(`Niepoprawna cena w groszach: "${priceArg}"`);
    }
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const r = await prisma.product.updateMany({ where: { id }, data: { price: Number(priceArg) } });
        if (r.count !== 1) throw new Error(`Oczekiwano 1 rekordu, zmieniono ${r.count}`);
        console.log(`OK: produkt ${id} kosztuje teraz ${priceArg} gr`);
    } finally {
        await prisma.$disconnect();
    }
}
main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
});