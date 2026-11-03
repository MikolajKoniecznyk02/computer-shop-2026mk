import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { validateProducts, type Product } from '@/lib/products/schema';
import { importCatalog } from '@/prisma/imports';
import { DEMO_USER } from '@/prisma/demo';

function assertTestDatabase(url: string) {
    const name = new URL(url).pathname.slice(1);
    const prodUrl = process.env.PROD_DATABASE_URL_FOR_GUARD;
    if (!name.endsWith('_test')) throw new Error(`Odmowa: baza "${name}" nie wygląda na testową`);
    if (prodUrl && new URL(prodUrl).pathname.slice(1) === name) throw new Error('Odmowa: baza testowa = produkcyjna');
}

export function createTestClient(): PrismaClient {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) throw new Error('Brak TEST_DATABASE_URL');
    assertTestDatabase(url);
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

//Czyści dane z bazy testowej i importuje podany zbiór.
export async function resetCatalog(prisma: PrismaClient, products: readonly Product[]) {
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await importCatalog(prisma, products);
}

export function loadRealProducts(): Product[] {
    return validateProducts(JSON.parse(readFileSync('data/products.json', 'utf-8')));
}

export const make = (o: Partial<Product>): Product => ({
    id: 1, code: 'AAAAAAAAA1', name: 'A', type: 'cpu', price: 100, amount: 1,
    description: 'x', date: '2026-01-01T10:00:00Z', image: '/images/products/cpu.webp', ...o,
});

/** Czyści koszyki, zamówienia, użytkowników i produkty (tylko BAZA TESTOWA), potem importuje podany katalog. */
export async function resetAll(
    prisma: PrismaClient,
    products: readonly Product[] = [
        make({ id: 1, code: 'AAAAAAAAA1', name: 'A', price: 1000 }),
        make({ id: 2, code: 'AAAAAAAAA2', name: 'B', price: 2500 }),
    ],
) {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.user.deleteMany();
    await resetCatalog(prisma, products);
    await prisma.verification.deleteMany();
}

export const createDemoUser = (prisma: PrismaClient) => prisma.user.create({ data: DEMO_USER });

export const createUser = (prisma: PrismaClient, id: string) =>
    prisma.user.create({
        data: { id, name: `Użytkownik ${id}`, email: `${id}@example.com`, emailVerified: true },
    });