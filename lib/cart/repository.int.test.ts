import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';
import {
    addProductForUser, getCartForUser, removeItemForUser, setQuantityForUser,
} from './repository';

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
    // osobne dane testowe, nie ruszają katalogu demonstracyjnego (to baza testowa)
    await resetAll(prisma, [
        make({ id: 1, code: 'AAAAAAAAA1', name: 'A', price: 1000, amount: 10 }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'B', price: 2500, amount: 1 }),
        make({ id: 3, code: 'AAAAAAAAA3', name: 'C', price: 500, amount: 0 }),
        make({ id: 4, code: 'AAAAAAAAA4', name: 'D', price: 100, amount: 500 }),
    ]);
    await createUser(prisma, A);
    await createUser(prisma, B);
});

const itemOf = (userId: string, productId: number) =>
    prisma.cartItem.findFirst({ where: { productId, cart: { userId } } });
const rows = (productId: number) => prisma.cartItem.count({ where: { productId } });

describe('odczyt i suma', () => {
    it('brak koszyka = pusty widok, suma 0, rekord nie jest tworzony', async () => {
        expect(await getCartForUser(A)).toEqual({ items: [], itemCount: 0, total: 0 });
        expect(await prisma.cart.count()).toBe(0);
    });

    it('suma wynika z aktualnych cen serwera', async () => {
        await addProductForUser(A, 1);
        await addProductForUser(A, 1);
        await addProductForUser(A, 2);
        expect((await getCartForUser(A)).total).toBe(2 * 1000 + 2500);
        await prisma.product.update({ where: { id: 1 }, data: { price: 3000 } });
        expect((await getCartForUser(A)).total).toBe(2 * 3000 + 2500);
    });

    it('po spadku stanu pozycja jest oznaczona i da się ją zmniejszyć', async () => {
        await setQuantityForUser(A, (await addAndGet(A, 1)).id, 5);
        await prisma.product.update({ where: { id: 1 }, data: { amount: 2 } });
        const view = await getCartForUser(A);
        expect(view.items[0].problem).toBe('EXCEEDS_STOCK');
        expect((await setQuantityForUser(A, view.items[0].id, 2)).ok).toBe(true);
        expect((await getCartForUser(A)).items[0].problem).toBeNull();
    });
});

async function addAndGet(userId: string, productId: number) {
    await addProductForUser(userId, productId);
    return prisma.cartItem.findFirstOrThrow({ where: { productId, cart: { userId } } });
}

describe('addProduct', () => {
    it('tworzy koszyk i pozycję, drugie dodanie zwiększa ilość bez duplikatu', async () => {
        expect(await addProductForUser(A, 1)).toEqual({ ok: true, data: { quantity: 1 } });
        expect(await addProductForUser(A, 1)).toEqual({ ok: true, data: { quantity: 2 } });
        expect(await rows(1)).toBe(1);
    });

    it('produkt niedostępny i nieistniejący nie zmieniają koszyka', async () => {
        expect(await addProductForUser(A, 3)).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
        expect(await addProductForUser(A, 999)).toMatchObject({ ok: false, code: 'NOT_FOUND' });
        expect(await prisma.cartItem.count()).toBe(0);
    });

    it('nie przekracza aktualnego stanu', async () => {
        expect((await addProductForUser(A, 2)).ok).toBe(true);
        expect(await addProductForUser(A, 2)).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
        expect((await itemOf(A, 2))?.quantity).toBe(1);
    });

    it('nie przekracza limitu 99', async () => {
        const item = await addAndGet(A, 4);
        expect((await setQuantityForUser(A, item.id, 99)).ok).toBe(true);
        expect(await addProductForUser(A, 4)).toMatchObject({ ok: false, code: 'LIMIT' });
        expect((await itemOf(A, 4))?.quantity).toBe(99);
    });
});

describe('równoległe dodawanie', () => {
    it('dwa dodania tego samego produktu (pusty koszyk) = +2, jedna pozycja', async () => {
        const r = await Promise.all([addProductForUser(A, 1), addProductForUser(A, 1)]);
        expect(r.every((x) => x.ok)).toBe(true);
        expect((await itemOf(A, 1))?.quantity).toBe(2);
        expect(await rows(1)).toBe(1);
        expect(await prisma.cart.count({ where: { userId: A } })).toBe(1);
    });

    it('przy jednej wolnej sztuce dokładnie jedno powodzenie', async () => {
        const r = await Promise.all([addProductForUser(A, 2), addProductForUser(A, 2)]);
        expect(r.filter((x) => x.ok)).toHaveLength(1);
        expect((await itemOf(A, 2))?.quantity).toBe(1);
    });

    it('przy limicie 99 jedno z dwóch dodań jest odrzucone', async () => {
        const item = await addAndGet(A, 4);
        await setQuantityForUser(A, item.id, 98);
        const r = await Promise.all([addProductForUser(A, 4), addProductForUser(A, 4)]);
        expect(r.filter((x) => x.ok)).toHaveLength(1);
        expect((await itemOf(A, 4))?.quantity).toBe(99);
    });

    it('20 równoległych prób przy stanie 5: dokładnie 5 powodzeń', async () => {
        await prisma.product.update({ where: { id: 1 }, data: { amount: 5 } });
        const r = await Promise.all(Array.from({ length: 20 }, () => addProductForUser(A, 1)));
        expect(r.filter((x) => x.ok)).toHaveLength(5);
        expect((await itemOf(A, 1))?.quantity).toBe(5);
        expect(await rows(1)).toBe(1);
    });
});

describe('własność pozycji (A kontra B)', () => {
    it('B nie zmieni ani nie usunie pozycji A; odmowa taka sama jak dla nieistniejącej', async () => {
        const item = await addAndGet(A, 1);
        const foreign = await setQuantityForUser(B, item.id, 5);
        const missing = await setQuantityForUser(B, 999999, 5);
        expect(foreign).toEqual(missing);
        expect(foreign).toMatchObject({ ok: false, code: 'NOT_FOUND' });
        expect(await removeItemForUser(B, item.id)).toMatchObject({ ok: false, code: 'NOT_FOUND' });
        expect((await itemOf(A, 1))?.quantity).toBe(1);
    });

    it('B nie widzi pozycji A', async () => {
        await addProductForUser(A, 1);
        expect(await getCartForUser(B)).toEqual({ items: [], itemCount: 0, total: 0 });
    });

    it('właściciel zmienia i usuwa własną pozycję', async () => {
        const item = await addAndGet(A, 1);
        expect((await setQuantityForUser(A, item.id, 7)).ok).toBe(true);
        expect((await itemOf(A, 1))?.quantity).toBe(7);
        expect((await setQuantityForUser(A, item.id, 11)).ok).toBe(false); // stan = 10
        expect((await removeItemForUser(A, item.id)).ok).toBe(true);
        expect(await itemOf(A, 1)).toBeNull();
    });
});

describe('ograniczenia SQL z pominięciem walidatora', () => {
    it.each([0, 100, -1])('baza odrzuca ilość %i', async (q) => {
        const item = await addAndGet(A, 1);
        await expect(
            prisma.$executeRaw`UPDATE "CartItem" SET "quantity" = ${q} WHERE "id" = ${item.id}`,
        ).rejects.toThrow();
    });

    it('baza odrzuca duplikat pary cartId/productId', async () => {
        const item = await addAndGet(A, 1);
        await expect(
            prisma.cartItem.create({ data: { cartId: item.cartId, productId: 1, quantity: 1 } }),
        ).rejects.toThrow();
    });

    it('drugi koszyk tego samego użytkownika jest odrzucony', async () => {
        await addProductForUser(A, 1);
        await expect(prisma.cart.create({ data: { userId: A } })).rejects.toThrow();
    });
});