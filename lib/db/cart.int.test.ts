import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, resetAll, createDemoUser } from '@/tests/helpers';

let prisma: PrismaClient;
beforeAll(() => {
    prisma = createTestClient();
});
afterAll(async () => {
    await prisma.$disconnect();
});
beforeEach(async () => {
    await resetAll(prisma);
});

const newCart = async () => {
    const user = await createDemoUser(prisma);
    return prisma.cart.create({ data: { userId: user.id } });
};

describe('User i koszyk', () => {
    it('fikcyjne konto ma komplet pól', async () => {
        const u = await createDemoUser(prisma);
        expect(u).toMatchObject({ id: 'user_demo_1', email: 'demo@example.com', emailVerified: true, image: null });
        expect(u.createdAt).toBeInstanceOf(Date);
        expect(u.updatedAt).toBeInstanceOf(Date);
    });

    it('email jest unikalny', async () => {
        await createDemoUser(prisma);
        await expect(
            prisma.user.create({ data: { id: 'user_2', name: 'Inny', email: 'demo@example.com' } }),
        ).rejects.toThrow();
    });

    it('drugi koszyk tego samego użytkownika jest odrzucony', async () => {
        const cart = await newCart();
        await expect(prisma.cart.create({ data: { userId: cart.userId } })).rejects.toThrow();
    });
});

describe('pozycje koszyka', () => {
    it('ta sama para cartId/productId nie może się powtórzyć', async () => {
        const cart = await newCart();
        await prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity: 1 } });
        await expect(
            prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity: 2 } }),
        ).rejects.toThrow();
    });

    it.each([1, 99])('ilość %i jest poprawna', async (quantity) => {
        const cart = await newCart();
        const item = await prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity } });
        expect(item.quantity).toBe(quantity);
    });

    it.each([0, -1, 100])('ilość %i odrzuca baza (CHECK)', async (quantity) => {
        const cart = await newCart();
        await expect(
            prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity } }),
        ).rejects.toThrow();
    });

    it('CHECK działa też przy surowym SQL (z pominięciem ORM)', async () => {
        const cart = await newCart();
        const item = await prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity: 1 } });
        await expect(
            prisma.$executeRaw`UPDATE "CartItem" SET "quantity" = 100 WHERE "id" = ${item.id}`,
        ).rejects.toThrow();
    });

    it('nieistniejący produkt odrzuca klucz obcy', async () => {
        const cart = await newCart();
        await expect(
            prisma.cartItem.create({ data: { cartId: cart.id, productId: 999, quantity: 1 } }),
        ).rejects.toThrow();
    });

    it('usunięcie koszyka usuwa jego pozycje', async () => {
        const cart = await newCart();
        await prisma.cartItem.createMany({
            data: [{ cartId: cart.id, productId: 1, quantity: 1 }, { cartId: cart.id, productId: 2, quantity: 3 }],
        });
        await prisma.cart.delete({ where: { id: cart.id } });
        expect(await prisma.cartItem.count()).toBe(0);
    });

    it('usunięcie produktu usuwa go z koszyków, ale nie usuwa koszyka', async () => {
        const cart = await newCart();
        await prisma.cartItem.create({ data: { cartId: cart.id, productId: 1, quantity: 1 } });
        await prisma.product.delete({ where: { id: 1 } });
        expect(await prisma.cartItem.count()).toBe(0);
        expect(await prisma.cart.count()).toBe(1);
    });
});