import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';
import type { CartResult } from '@/lib/cart/types';
import { checkoutForUser } from './checkout';
import { getOrderForUser } from './repository';

const A = 'user_a';
const B = 'user_b';
let prisma: PrismaClient;

beforeAll(() => {
    prisma = createTestClient();
});
afterAll(async () => {
    await prisma.$disconnect();
});
beforeEach(async () => {
    await resetAll(prisma, [
        make({ id: 1, code: 'AAAAAAAAA1', name: 'Alfa', price: 1000, amount: 10 }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'Beta', price: 2500, amount: 1 }), // ostatnia sztuka
        make({ id: 3, code: 'AAAAAAAAA3', name: 'Gamma', price: 500, amount: 5 }),
    ]);
    await createUser(prisma, A);
    await createUser(prisma, B);
});

async function fill(userId: string, lines: [number, number][]) {
    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const [productId, quantity] of lines) {
        await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
    }
}
const stock = async (id: number) => (await prisma.product.findUniqueOrThrow({ where: { id } })).amount;
const placed = (r: CartResult<{ orderNumber: string; replayed: boolean }>) => {
    if (!r.ok) throw new Error(`checkout nieudany: ${r.code} ${r.message}`);
    return r.data;
};

describe('poprawny zakup', () => {
    it('tworzy zamówienie ze snapshotem, zmniejsza stan i czyści koszyk', async () => {
        await fill(A, [[1, 2], [2, 1]]);
        const { orderNumber, replayed } = placed(await checkoutForUser(A, randomUUID()));
        expect(replayed).toBe(false);
        expect(orderNumber).toMatch(/^ZAM-\d{4}-\d{4}$/);

        const order = await getOrderForUser(A, orderNumber);
        expect(order).toMatchObject({ status: 'PENDING', total: 2 * 1000 + 2500, itemCount: 3 });
        expect(order?.lines).toEqual([
            { position: 1, productId: 1, code: 'AAAAAAAAA1', name: 'Alfa', quantity: 2, unitPrice: 1000, lineTotal: 2000 },
            { position: 2, productId: 2, code: 'AAAAAAAAA2', name: 'Beta', quantity: 1, unitPrice: 2500, lineTotal: 2500 },
        ]);
        expect(await stock(1)).toBe(8);
        expect(await stock(2)).toBe(0);
        expect(await prisma.cartItem.count()).toBe(0);
        expect(await prisma.cart.count({ where: { userId: A } })).toBe(1); // sam koszyk zostaje
    });

    it('zmiana ceny i nazwy produktu po zakupie nie zmienia zamówienia', async () => {
        await fill(A, [[1, 2]]);
        const { orderNumber } = placed(await checkoutForUser(A, randomUUID()));
        const before = await getOrderForUser(A, orderNumber);
        await prisma.product.update({ where: { id: 1 }, data: { price: 99999, name: 'Zmieniona nazwa' } });
        expect(await getOrderForUser(A, orderNumber)).toEqual(before);
    });

    it('usunięcie produktu zachowuje historię (SetNull + snapshot)', async () => {
        await fill(A, [[1, 1]]);
        const { orderNumber } = placed(await checkoutForUser(A, randomUUID()));
        await prisma.product.delete({ where: { id: 1 } }); // koszyk jest już pusty, więc Restrict nie blokuje
        const order = await getOrderForUser(A, orderNumber);
        expect(order?.lines[0]).toMatchObject({ productId: null, name: 'Alfa', code: 'AAAAAAAAA1', unitPrice: 1000 });
    });

    it('nie rusza koszyka innego użytkownika', async () => {
        await fill(A, [[1, 1]]);
        await fill(B, [[3, 2]]);
        placed(await checkoutForUser(A, randomUUID()));
        expect(await prisma.cartItem.count({ where: { cart: { userId: B } } })).toBe(1);
        expect(await stock(3)).toBe(5);
    });
});

describe('błędy i wycofanie transakcji', () => {
    it('pusty koszyk i brak koszyka', async () => {
        expect(await checkoutForUser(A, randomUUID())).toMatchObject({ ok: false, code: 'EMPTY_CART' });
        await prisma.cart.create({ data: { userId: A } });
        expect(await checkoutForUser(A, randomUUID())).toMatchObject({ ok: false, code: 'EMPTY_CART' });
        expect(await prisma.order.count()).toBe(0);
    });

    it('brak stanu przy drugiej pozycji wycofuje całość (stan pierwszej, zamówienie, koszyk)', async () => {
        await fill(A, [[1, 2], [2, 1]]);
        await prisma.product.update({ where: { id: 2 }, data: { amount: 0 } });
        const r = await checkoutForUser(A, randomUUID());
        expect(r).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
        expect(await stock(1)).toBe(10); // produkt 1 był zmniejszony w transakcji i został przywrócony
        expect(await prisma.order.count()).toBe(0);
        expect(await prisma.cartItem.count()).toBe(2);
    });

    it('ilość większa niż aktualny stan jest odrzucona', async () => {
        await fill(A, [[3, 5]]);
        await prisma.product.update({ where: { id: 3 }, data: { amount: 4 } });
        expect(await checkoutForUser(A, randomUUID())).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
        expect(await stock(3)).toBe(4);
    });
});

describe('idempotencja', () => {
    it('ponowienie tego samego żądania nie tworzy drugiego zamówienia', async () => {
        await fill(A, [[1, 2]]);
        const key = randomUUID();
        const first = placed(await checkoutForUser(A, key));
        const second = placed(await checkoutForUser(A, key));
        expect(second).toEqual({ orderNumber: first.orderNumber, replayed: true });
        expect(await prisma.order.count()).toBe(1);
        expect(await stock(1)).toBe(8); // stan zmniejszony tylko raz
    });

    it('dwa równoległe żądania z tym samym kluczem dają jedno zamówienie', async () => {
        await fill(A, [[1, 2]]);
        const key = randomUUID();
        const results = await Promise.all([checkoutForUser(A, key), checkoutForUser(A, key)]);
        const data = results.map(placed);
        expect(data[0].orderNumber).toBe(data[1].orderNumber);
        expect(data.filter((d) => !d.replayed)).toHaveLength(1);
        expect(await prisma.order.count()).toBe(1);
        expect(await stock(1)).toBe(8);
    });

    it('ten sam klucz u dwóch różnych użytkowników jest dozwolony', async () => {
        await fill(A, [[1, 1]]);
        await fill(B, [[3, 1]]);
        const key = randomUUID();
        const [ra, rb] = await Promise.all([checkoutForUser(A, key), checkoutForUser(B, key)]);
        expect(placed(ra).orderNumber).not.toBe(placed(rb).orderNumber);
        expect(await prisma.order.count()).toBe(2);
    });

    it('baza odrzuca zły format i duplikat klucza z pominięciem aplikacji', async () => {
        await fill(A, [[1, 1]]);
        const key = randomUUID();
        placed(await checkoutForUser(A, key));
        await expect(
            prisma.$executeRaw`INSERT INTO "Order" ("number","userId","status","totalPrice","requestKey") VALUES ('ZAM-2026-9000', ${A}, 'PENDING'::"OrderStatus", 0, 'zly-klucz')`,
        ).rejects.toThrow();
        await expect(
            prisma.$executeRaw`INSERT INTO "Order" ("number","userId","status","totalPrice","requestKey") VALUES ('ZAM-2026-9001', ${A}, 'PENDING'::"OrderStatus", 0, ${key})`,
        ).rejects.toThrow();
    });
});

describe('ostatnia sztuka', () => {
    it('dwóch użytkowników kupuje ostatnią sztukę: dokładnie jeden sukces', async () => {
        await fill(A, [[2, 1]]);
        await fill(B, [[2, 1]]);
        const results = await Promise.all([checkoutForUser(A, randomUUID()), checkoutForUser(B, randomUUID())]);
        expect(results.filter((r) => r.ok)).toHaveLength(1);
        expect(results.filter((r) => !r.ok && r.code === 'OUT_OF_STOCK')).toHaveLength(1);
        expect(await stock(2)).toBe(0);
        expect(await prisma.order.count()).toBe(1);
        expect(await prisma.cartItem.count()).toBe(1); // koszyk przegranego pozostaje nietknięty
    });

    it('wielu kupujących przy stanie 5: dokładnie 5 sukcesów', async () => {
        await prisma.product.update({ where: { id: 3 }, data: { amount: 5 } });
        const ids = Array.from({ length: 8 }, (_, i) => `user_${i}`);
        for (const id of ids) {
            await createUser(prisma, id);
            await fill(id, [[3, 1]]);
        }
        const results = await Promise.all(ids.map((id) => checkoutForUser(id, randomUUID())));
        expect(results.filter((r) => r.ok)).toHaveLength(5);
        expect(await stock(3)).toBe(0);
        expect(await prisma.order.count()).toBe(5);
    });
});