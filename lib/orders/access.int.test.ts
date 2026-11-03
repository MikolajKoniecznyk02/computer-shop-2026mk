import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';

const getCurrentSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/session', () => ({ getCurrentSession }));

import { getMyOrder, getMyOrders, placeOrder } from './access';

const A = 'user_a';
const B = 'user_b';
const asUser = (id: string) => getCurrentSession.mockResolvedValue({ user: { id }, session: { id: 's' } });
const anonymous = () => getCurrentSession.mockResolvedValue(null);

let prisma: PrismaClient;
beforeAll(() => {
    prisma = createTestClient();
});
afterAll(async () => {
    await prisma.$disconnect();
});

let orderA = '';
let orderB = '';
beforeEach(async () => {
    await resetAll(prisma, [
        make({ id: 1, code: 'AAAAAAAAA1', name: 'Alfa', price: 1000, amount: 10 }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'Beta', price: 2500, amount: 10 }),
    ]);
    await createUser(prisma, A);
    await createUser(prisma, B);
    for (const [user, productId] of [[A, 1], [B, 2]] as const) {
        const cart = await prisma.cart.create({ data: { userId: user } });
        await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: 2 } });
        asUser(user);
        const r = await placeOrder(randomUUID());
        if (!r.ok) throw new Error(r.message);
        if (user === A) orderA = r.data.orderNumber;
        else orderB = r.data.orderNumber;
    }
    anonymous();
});

describe('brak sesji', () => {
    it('odczyt historii i szczegółów wymaga logowania', async () => {
        expect(await getMyOrders()).toEqual({ status: 'unauthenticated' });
        expect(await getMyOrder(orderA)).toEqual({ status: 'unauthenticated' });
    });

    it('checkout bez sesji jest odrzucony i niczego nie zmienia', async () => {
        const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: A } });
        await prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity: 1 } });
        const ordersBefore = await prisma.order.count();
        const stockBefore = (await prisma.product.findUniqueOrThrow({ where: { id: 1 } })).amount;

        expect(await placeOrder(randomUUID())).toMatchObject({ ok: false, code: 'UNAUTHENTICATED' });
        expect(await prisma.order.count()).toBe(ordersBefore);
        expect((await prisma.product.findUniqueOrThrow({ where: { id: 1 } })).amount).toBe(stockBefore);
        expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(1);
    });
});

describe('użytkownik A i zamówienia B', () => {
    it('historia zawiera tylko własne zamówienia', async () => {
        asUser(A);
        const r = await getMyOrders();
        expect(r.status === 'ok' && r.orders.map((o) => o.number)).toEqual([orderA]);
    });

    it('podmiana numeru na zamówienie B daje tę samą odmowę co numer nieistniejący', async () => {
        asUser(A);
        const foreign = await getMyOrder(orderB);
        const missing = await getMyOrder('ZAM-2026-9999');
        expect(foreign).toEqual({ status: 'not-found' });
        expect(foreign).toEqual(missing);
    });

    it.each(['abc', "ZAM-2026-1000' OR 1=1", '', null, undefined, 5])('błędny numer %j → not-found', async (v) => {
        asUser(A);
        expect(await getMyOrder(v)).toEqual({ status: 'not-found' });
    });

    it('właściciel widzi szczegóły i snapshot', async () => {
        asUser(A);
        const r = await getMyOrder(orderA);
        expect(r.status).toBe('ok');
        if (r.status === 'ok') {
            expect(r.order.total).toBe(2000);
            expect(r.order.lines[0]).toMatchObject({ name: 'Alfa', quantity: 2, unitPrice: 1000 });
        }
    });

    it('historia nie zmienia się po zmianie ceny i usunięciu produktu', async () => {
        asUser(A);
        const before = await getMyOrder(orderA);
        await prisma.product.update({ where: { id: 1 }, data: { price: 1, name: 'Inna' } });
        await prisma.product.delete({ where: { id: 1 } });
        const after = await getMyOrder(orderA);
        expect(after.status).toBe('ok');
        if (before.status === 'ok' && after.status === 'ok') {
            expect(after.order.total).toBe(before.order.total);
            expect(after.order.lines[0]).toMatchObject({ name: 'Alfa', unitPrice: 1000, productId: null });
        }
    });
});

describe('walidacja klucza żądania', () => {
    it.each(['', 'abc', null, undefined, 5])('placeOrder odrzuca klucz %j', async (key) => {
        asUser(A);
        expect(await placeOrder(key)).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    });
});