import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const [categories, products, sums, sample] = await Promise.all([
            prisma.category.count(),
            prisma.product.count(),
            prisma.product.aggregate({ _sum: { price: true, amount: true } }),
            prisma.product.findMany({ where: { id: { in: [1, 8, 100] } }, orderBy: { id: 'asc' } }),
        ]);
        console.log({ categories, products, sumPrice: sums._sum.price, sumAmount: sums._sum.amount });
        console.table(sample.map((p) => ({ id: p.id, code: p.code, name: p.name, price: p.price, amount: p.amount, date: p.date.toISOString() })));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});