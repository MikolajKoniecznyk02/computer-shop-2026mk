import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, resetAll, createDemoUser, loadRealProducts } from '@/tests/helpers';
import { importDemo } from '@/prisma/demo';

let prisma: PrismaClient;
beforeAll(() => {
    prisma = createTestClient();
});
afterAll(async () => {
    await prisma.$disconnect();
});

const line = (o: Record<string, unknown> = {}) => ({
    position: 1, productId: 1, productCode: 'AAAAAAAAA1', productName: 'A',
    quantity: 2, unitPrice: 1000, lineTotal: BigInt(2000), ...o,
});
const newOrder = async (number = 'ZAM-2026-0001') => {
    const user = (await prisma.user.findFirst()) ?? (await createDemoUser(prisma));
    return prisma.order.create({ data: { number, userId: user.id, status: 'PAID', totalPrice: BigInt(2000) } });
};

describe('dane demonstracyjne', () => {
    beforeEach(async () => {
        await resetAll(prisma, loadRealProducts());
    });

    const dump = async () => {
        const orders = await prisma.order.findMany({ orderBy: { number: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } });
        return orders.map((o) => ({
            number: o.number, status: o.status, createdAt: o.createdAt.toISOString(), total: o.totalPrice.toString(),
            items: o.items.map((i) => ({ id: i.id, pos: i.position, code: i.productCode, name: i.productName, qty: i.quantity, unit: i.unitPrice, line: i.lineTotal.toString() })),
        }));
    };

    it('seed tworzy 4 zamówienia, a drugi seed nic nie zmienia (w tym id pozycji)', async () => {
        await importDemo(prisma, loadRealProducts());
        const first = await dump();
        expect(first).toHaveLength(4);
        await importDemo(prisma, loadRealProducts());
        expect(await dump()).toEqual(first);
        expect(await prisma.user.count()).toBe(1);
        expect(await prisma.cart.count()).toBe(1);
        expect(await prisma.cartItem.count()).toBe(2);
    });

    it('suma zamówienia = suma pozycji, pozycja = cena * ilość', async () => {
        await importDemo(prisma, loadRealProducts());
        const orders = await prisma.order.findMany({ include: { items: true } });
        for (const o of orders) {
            expect(o.items.reduce((s, i) => s + i.lineTotal, BigInt(0))).toBe(o.totalPrice);
            for (const i of o.items) expect(i.lineTotal).toBe(BigInt(i.unitPrice) * BigInt(i.quantity));
        }
    });

    it('zmiana aktualnej ceny produktów nie zmienia zamówień', async () => {
        await importDemo(prisma, loadRealProducts());
        const before = await dump();
        await prisma.product.updateMany({ data: { price: 1 } });
        expect(await dump()).toEqual(before);
    });

    it('usunięcie produktu zachowuje historię (SetNull + snapshot)', async () => {
        await importDemo(prisma, loadRealProducts());
        const item = await prisma.orderItem.findFirstOrThrow({ where: { productId: 1 } });
        await prisma.cartItem.deleteMany({ where: { productId: 1 } });
        await prisma.product.delete({ where: { id: 1 } });
        const after = await prisma.orderItem.findUniqueOrThrow({ where: { id: item.id } });
        expect(after.productId).toBeNull();
        expect(after.productName).toBe(item.productName);
        expect(after.productCode).toBe(item.productCode);
        expect(after.unitPrice).toBe(item.unitPrice);
        expect(await prisma.order.count()).toBe(4);
    });
});

describe('ograniczenia zamówień (baza, nie walidator)', () => {
    beforeEach(async () => {
        await resetAll(prisma);
    });

    it('poprawna pozycja jest zapisana', async () => {
        const o = await newOrder();
        const i = await prisma.orderItem.create({ data: { orderId: o.id, ...line() } });
        expect(i.lineTotal).toBe(BigInt(2000));
    });

    it.each([0, -1])('ilość %i odrzucona', async (quantity) => {
        const o = await newOrder();
        await expect(
            prisma.orderItem.create({ data: { orderId: o.id, ...line({ quantity, lineTotal: BigInt(0) }) } }),
        ).rejects.toThrow();
    });

    it('ujemna cena jednostkowa odrzucona', async () => {
        const o = await newOrder();
        await expect(
            prisma.orderItem.create({ data: { orderId: o.id, ...line({ unitPrice: -1, lineTotal: BigInt(-2) }) } }),
        ).rejects.toThrow();
    });

    it('niezgodna wartość pozycji odrzucona', async () => {
        const o = await newOrder();
        await expect(
            prisma.orderItem.create({ data: { orderId: o.id, ...line({ lineTotal: BigInt(1) }) } }),
        ).rejects.toThrow();
    });

    it('skrajne wartości mieszczą się w BigInt', async () => {
        const o = await newOrder();
        const max = 2147483647;
        const i = await prisma.orderItem.create({
            data: { orderId: o.id, ...line({ unitPrice: max, quantity: max, lineTotal: BigInt(max) * BigInt(max) }) },
        });
        expect(i.lineTotal).toBe(BigInt(max) * BigInt(max));
    });

    it('powtórzona pozycja w zamówieniu odrzucona', async () => {
        const o = await newOrder();
        await prisma.orderItem.create({ data: { orderId: o.id, ...line() } });
        await expect(prisma.orderItem.create({ data: { orderId: o.id, ...line() } })).rejects.toThrow();
    });

    it('duplikat numeru zamówienia i zły format numeru odrzucone', async () => {
        await newOrder('ZAM-2026-0001');
        await expect(newOrder('ZAM-2026-0001')).rejects.toThrow();
        await expect(newOrder('XYZ')).rejects.toThrow();
    });

    it('nieznany status odrzuca baza (surowy SQL)', async () => {
        const user = await createDemoUser(prisma);
        await expect(
            prisma.$executeRaw`INSERT INTO "Order" ("number","userId","status","totalPrice") VALUES ('ZAM-2026-0009', ${user.id}, 'REFUNDED'::"OrderStatus", 0)`,
        ).rejects.toThrow();
    });

    it('nie da się usunąć użytkownika, który ma zamówienia (Restrict)', async () => {
        const o = await newOrder();
        await expect(prisma.user.delete({ where: { id: o.userId } })).rejects.toThrow();
    });

    it('usunięcie zamówienia usuwa jego pozycje', async () => {
        const o = await newOrder();
        await prisma.orderItem.create({ data: { orderId: o.id, ...line() } });
        await prisma.order.delete({ where: { id: o.id } });
        expect(await prisma.orderItem.count()).toBe(0);
    });
});