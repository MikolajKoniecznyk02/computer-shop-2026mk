import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, resetCatalog, make } from '@/tests/helpers';
import { queryProducts, type ProductQuery } from './query';
import { getProducts, getProductById } from './repository';

const DATASET = [
    make({ id: 1, code: 'AAAAAAAAA1', name: 'Zebra', type: 'cpu', amount: 5, date: '2026-03-01T10:00:00.123Z' }),
    make({ id: 2, code: 'AAAAAAAAA2', name: 'Abc', type: 'cpu', amount: 0, date: '2026-03-01T10:00:00.456Z' }),
    make({ id: 3, code: 'AAAAAAAAA3', name: 'abc', type: 'gpu', amount: 3, date: '2026-03-01T10:00:00.456Z' }),
    make({ id: 4, code: 'AAAAAAAAA4', name: 'Żółw', type: 'gpu', amount: 0, date: '2026-01-01T00:00:00.000Z' }),
    make({ id: 5, code: 'AAAAAAAAA5', name: 'ąbc', type: 'ram', amount: 1, date: '2026-05-01T00:00:00.000Z' }),
    make({ id: 6, code: 'AAAAAAAAA6', name: 'Łódź', type: 'disk', amount: 0, date: '2026-03-01T10:00:00.000Z' }),
    make({ id: 7, code: 'AAAAAAAAA7', name: 'Ćma', type: 'disk', amount: 2, date: '2026-01-01T00:00:00.000Z' }),
];

let prisma: PrismaClient;
beforeAll(async () => {
    prisma = createTestClient();
    await resetCatalog(prisma, DATASET);
});
afterAll(async () => {
    await prisma.$disconnect();
});

const ids = (list: { id: number }[]) => list.map((p) => p.id);

describe('kolejność', () => {
    it('name: klucz UTF-8 (C), remis po id', async () => {
        expect(ids(await getProducts({ sort: 'name' }))).toEqual([2, 3, 1, 5, 7, 6, 4]);
    });
    it('newest: data malejąco, remis po id', async () => {
        expect(ids(await getProducts({ sort: 'date' }))).toEqual([5, 2, 3, 1, 6, 4, 7]);
    });
    it('domyślnie sortuje po nazwie', async () => {
        expect(ids(await getProducts())).toEqual([2, 3, 1, 5, 7, 6, 4]);
    });
});

describe('zgodność adapterów: baza = referencja w pamięci', () => {
    const types = [undefined, 'cpu', 'gpu', 'ram', 'disk'] as const;
    const stocks = [undefined, 'available', 'unavailable'] as const;
    const sorts = ['name', 'date'] as const;
    for (const type of types)
        for (const availability of stocks)
            for (const sort of sorts) {
                const q: ProductQuery = { type, availability, sort };
                it(`type=${type} stock=${availability} sort=${sort}`, async () => {
                    expect(ids(await getProducts(q))).toEqual(ids(queryProducts(DATASET, q)));
                });
            }
});

describe('filtry i wartości', () => {
    it('filtry łączą się', async () => {
        expect(ids(await getProducts({ type: 'gpu', availability: 'available' }))).toEqual([3]);
    });
    it('pusty wynik to []', async () => {
        expect(await getProducts({ type: 'ram', availability: 'unavailable' })).toEqual([]);
    });
    it('data zachowuje milisekundy', async () => {
        expect((await getProductById(1))?.date).toBe('2026-03-01T10:00:00.123Z');
    });
    it('produkt ze stanem zero istnieje', async () => {
        expect((await getProductById(2))?.amount).toBe(0);
    });
    it('model domenowy: type z kategorii, cena w groszach', async () => {
        expect(await getProductById(5)).toMatchObject({ type: 'ram', price: 100 });
    });
});

describe('brak produktu i identyfikatory', () => {
    it.each([999, 0, -1, 2147483648, 1.5, Number.NaN])('id %s → null bez błędu ORM', async (id) => {
        expect(await getProductById(id)).toBeNull();
    });
});

describe('awaria bazy', () => {
    it('odrzuca Promise zamiast zwracać [] lub null', async () => {
        vi.resetModules();
        const boom = () => Promise.reject(new Error('baza niedostępna'));
        vi.doMock('@/lib/db/prisma', () => ({
            getPrisma: () => ({ product: { findMany: boom, findUnique: boom } }),
        }));
        const repo = await import('./repository');
        await expect(repo.getProducts()).rejects.toThrow('baza niedostępna');
        await expect(repo.getProductById(1)).rejects.toThrow('baza niedostępna');
        vi.doUnmock('@/lib/db/prisma');
    });
});