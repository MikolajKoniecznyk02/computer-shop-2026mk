import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';

const getCurrentSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/session', () => ({ getCurrentSession }));

import { addProduct, getMyCart, removeItem, setQuantity } from './access';

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
beforeEach(async () => {
    await resetAll(prisma, [
        make({ id: 1, code: 'AAAAAAAAA1', name: 'A', price: 1000, amount: 10 }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'B', price: 2500, amount: 10 }),
    ]);
    await createUser(prisma, A);
    await createUser(prisma, B);
    anonymous();
});

const state = async () => ({
    carts: await prisma.cart.count(),
    items: await prisma.cartItem.findMany({ orderBy: { id: 'asc' }, include: { cart: true } }),
});

describe('brak sesji', () => {
    it('odczyt zwraca null', async () => {
        expect(await getMyCart()).toBeNull();
    });

    it('każda mutacja jest odrzucona i nic nie zmienia', async () => {
        asUser(A);
        await addProduct(1);
        const before = await state();

        anonymous();
        const itemId = before.items[0].id;
        expect(await addProduct(1)).toMatchObject({ ok: false, code: 'UNAUTHENTICATED' });
        expect(await setQuantity(itemId, 5)).toMatchObject({ ok: false, code: 'UNAUTHENTICATED' });
        expect(await removeItem(itemId)).toMatchObject({ ok: false, code: 'UNAUTHENTICATED' });
        expect(await state()).toEqual(before);
    });
});

describe('właściciel pochodzi z sesji, nie z danych wejściowych', () => {
    it('dodatkowy argument z cudzym userId jest ignorowany', async () => {
        asUser(A);
        await (addProduct as (...args: unknown[]) => Promise<unknown>)(1, B);
        const s = await state();
        expect(s.items).toHaveLength(1);
        expect(s.items[0].cart.userId).toBe(A);
    });

    it('A nie zmieni ani nie usunie pozycji B (cudze ID = nieistniejące ID)', async () => {
        asUser(B);
        await addProduct(1);
        const bItem = (await state()).items[0];

        asUser(A);
        const foreign = await setQuantity(bItem.id, 9);
        const missing = await setQuantity(987654, 9);
        expect(foreign).toEqual(missing);
        expect(foreign).toMatchObject({ ok: false, code: 'NOT_FOUND' });
        expect(await removeItem(bItem.id)).toMatchObject({ ok: false, code: 'NOT_FOUND' });

        const after = (await state()).items[0];
        expect(after).toMatchObject({ id: bItem.id, quantity: 1 });
        expect(after.cart.userId).toBe(B);
        expect((await getMyCart())?.items).toEqual([]);
    });
});

describe('walidacja po stronie serwera', () => {
    it.each(['0', '-1', '1.5', '100', '', 'abc', 0, -1, 1.5, 100, Number.NaN, null, undefined])(
        'setQuantity odrzuca ilość %j bez zmiany danych',
        async (q) => {
            asUser(A);
            await addProduct(1);
            const itemId = (await state()).items[0].id;
            expect(await setQuantity(itemId, q)).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
            expect((await state()).items[0].quantity).toBe(1);
        },
    );

    it.each(['abc', '12abc', '0', '-1', '01', '2147483648', 1.5, null, undefined])(
        'addProduct odrzuca id %j',
        async (id) => {
            asUser(A);
            expect(await addProduct(id)).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
            expect((await state()).items).toHaveLength(0);
        },
    );

    it('addProduct: nieistniejący produkt', async () => {
        asUser(A);
        expect(await addProduct(999)).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    });

    it('ilość większa niż stan jest odrzucona', async () => {
        asUser(A);
        await addProduct(1);
        const itemId = (await state()).items[0].id;
        expect(await setQuantity(itemId, 11)).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
    });
});