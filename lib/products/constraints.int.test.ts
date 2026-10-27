import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, resetCatalog, make } from '@/tests/helpers';

let prisma: PrismaClient;
beforeAll(async () => {
    prisma = createTestClient();
    await resetCatalog(prisma, [
        make({ id: 1, code: 'AAAAAAAAA1' }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'B' }),
    ]);
});
afterAll(async () => {
    await prisma.$disconnect();
});

describe('baza odrzuca niepoprawne dane (surowy SQL, z pominięciem walidatora)', () => {
    it('ujemna cena', async () => {
        await expect(prisma.$executeRaw`UPDATE "Product" SET "price" = -1 WHERE "id" = 1`).rejects.toThrow();
    });
    it('ujemny stan', async () => {
        await expect(prisma.$executeRaw`UPDATE "Product" SET "amount" = -1 WHERE "id" = 1`).rejects.toThrow();
    });
    it('duplikat kodu', async () => {
        await expect(prisma.$executeRaw`UPDATE "Product" SET "code" = 'AAAAAAAAA1' WHERE "id" = 2`).rejects.toThrow();
    });
    it('zły format kodu', async () => {
        await expect(prisma.$executeRaw`UPDATE "Product" SET "code" = 'abc' WHERE "id" = 1`).rejects.toThrow();
    });
    it('nieistniejąca kategoria (klucz obcy)', async () => {
        await expect(prisma.$executeRaw`UPDATE "Product" SET "categoryId" = 999999 WHERE "id" = 1`).rejects.toThrow();
    });
    it('id niedodatnie', async () => {
        await expect(
            prisma.$executeRaw`UPDATE "Product" SET "id" = 0 WHERE "id" = 1`,
        ).rejects.toThrow();
    });
    it('nie da się usunąć kategorii z produktami (Restrict)', async () => {
        await expect(prisma.category.deleteMany({ where: { code: 'cpu' } })).rejects.toThrow();
    });
});

describe('ten sam efekt przez ORM', () => {
    it('Prisma też nie zapisze ujemnej ceny', async () => {
        await expect(prisma.product.update({ where: { id: 1 }, data: { price: -5 } })).rejects.toThrow();
    });
    it('poprawna zmiana jest zapisana', async () => {
        await prisma.product.update({ where: { id: 1 }, data: { amount: 9 } });
        expect((await prisma.product.findUnique({ where: { id: 1 } }))?.amount).toBe(9);
    });
});