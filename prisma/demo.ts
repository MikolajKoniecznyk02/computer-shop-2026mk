import type { PrismaClient } from '../lib/generated/prisma/client';
import type { Product } from '../lib/products/schema';

type Status = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const DEMO_USER = {
    id: 'user_demo_1',
    name: 'Jan Demo',
    email: 'demo@example.com',
    emailVerified: true,
    image: null,
};



const ORDERS: readonly {
    number: string;
    status: Status;
    createdAt: string;
    items: readonly (readonly [number, number])[];
}[] = [
        { number: 'ZAM-2026-0001', status: 'DELIVERED', createdAt: '2026-08-03T10:15:00.000Z', items: [[1, 1], [2, 2]] },
        { number: 'ZAM-2026-0002', status: 'SHIPPED', createdAt: '2026-09-10T14:30:00.250Z', items: [[5, 1], [8, 3]] },
        { number: 'ZAM-2026-0003', status: 'PAID', createdAt: '2026-10-01T08:00:00.000Z', items: [[12, 2]] },
        { number: 'ZAM-2026-0004', status: 'CANCELLED', createdAt: '2026-10-12T19:45:00.000Z', items: [[20, 1], [33, 1], [47, 4]] },
    ];

//import danych demo: użytkownik, koszyk, zamówienia i pozycje zamówień
export async function importDemo(prisma: PrismaClient, products: readonly Product[]) {
    const byId = new Map(products.map((p) => [p.id, p]));
    const need = (id: number): Product => {
        const p = byId.get(id);
        if (!p) throw new Error(`Dane demo odwołują się do nieistniejącego produktu ${id}`);
        return p;
    };

    await prisma.$transaction(
        async (tx) => {
            await tx.user.upsert({
                where: { id: DEMO_USER.id },
                update: { name: DEMO_USER.name, email: DEMO_USER.email, emailVerified: DEMO_USER.emailVerified, image: DEMO_USER.image },
                create: DEMO_USER,
            });

            for (const o of ORDERS) {
                // snapshot: ceny, nazwy i kody brane z danych wejściowych w chwili "zakupu"
                const lines = o.items.map(([productId, quantity], i) => {
                    const p = need(productId);
                    return {
                        position: i + 1,
                        productId,
                        productCode: p.code,
                        productName: p.name,
                        quantity,
                        unitPrice: p.price,
                        lineTotal: BigInt(p.price) * BigInt(quantity),
                    };
                });
                const totalPrice = lines.reduce((sum, l) => sum + l.lineTotal, BigInt(0));

                const order = await tx.order.upsert({
                    where: { number: o.number },
                    update: { userId: DEMO_USER.id, status: o.status, totalPrice, createdAt: new Date(o.createdAt) },
                    create: { number: o.number, userId: DEMO_USER.id, status: o.status, totalPrice, createdAt: new Date(o.createdAt) },
                });

                for (const l of lines) {
                    await tx.orderItem.upsert({
                        where: { orderId_position: { orderId: order.id, position: l.position } },
                        update: l,
                        create: { orderId: order.id, ...l },
                    });
                }
                await tx.orderItem.deleteMany({
                    where: { orderId: order.id, position: { notIn: lines.map((l) => l.position) } },
                });
            }
        },
        { timeout: 60_000 },
    );
}