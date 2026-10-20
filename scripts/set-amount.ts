import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { parseProductId } from '../lib/products/id';

const MAX_AMOUNT = 2147483647;

async function main() {
    const [idArg = '', amountArg = ''] = process.argv.slice(2);

    const id = parseProductId(idArg);
    if (id === null) throw new Error(`Niepoprawne id: "${idArg}"`);
    if (!/^(0|[1-9][0-9]*)$/.test(amountArg) || Number(amountArg) > MAX_AMOUNT) {
        throw new Error(`Niepoprawny stan: "${amountArg}" (oczekiwano 0..${MAX_AMOUNT})`);
    }
    const amount = Number(amountArg);

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const result = await prisma.product.updateMany({ where: { id }, data: { amount } });
        if (result.count !== 1) {
            throw new Error(`Oczekiwano dokładnie 1 zmienionego rekordu, zmieniono ${result.count}`);
        }
        console.log(`OK: produkt ${id} ma teraz stan ${amount}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
});