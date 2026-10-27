import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const orders = await prisma.order.findMany({
            orderBy: { number: 'asc' },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        console.table(
            orders.map((o) => ({
                number: o.number,
                status: o.status,
                items: o.items.length,
                total: o.totalPrice.toString(),
                sumOfLines: o.items.reduce((s, i) => s + i.lineTotal, BigInt(0)).toString(),
            })),
        );
        console.table(
            orders.flatMap((o) =>
                o.items.map((i) => ({
                    order: o.number, pos: i.position, productId: i.productId, code: i.productCode,
                    name: i.productName, qty: i.quantity, unitPrice: i.unitPrice, line: i.lineTotal.toString(),
                })),
            ),
        );
    } finally {
        await prisma.$disconnect();
    }
}
main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});