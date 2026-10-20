import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getProductById, notFound } = vi.hoisted(() => ({
    getProductById: vi.fn(),
    notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

vi.mock('@/lib/products/repository', () => ({ getProductById, getProducts: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('next/server', () => ({ connection: async () => { } }));

import ProductPage, { generateMetadata } from './page';

const product = {
    id: 8, code: 'ABCDEFGHI8', name: 'Testowy dysk', type: 'disk', price: 12345, amount: 0,
    description: 'x', date: '2026-01-01T10:00:00Z', image: '/images/products/disk.webp',
};
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
    getProductById.mockReset();
    notFound.mockClear();
});

describe('strona szczegółów', () => {
    it('błędny format → notFound, repozytorium nieodpytane', async () => {
        await expect(ProductPage(params('12abc'))).rejects.toThrow('NEXT_NOT_FOUND');
        expect(getProductById).not.toHaveBeenCalled();
    });

    it('null z repozytorium → notFound', async () => {
        getProductById.mockResolvedValue(null);
        await expect(ProductPage(params('101'))).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('produkt ze stanem zero renderuje się normalnie', async () => {
        getProductById.mockResolvedValue(product);
        await expect(ProductPage(params('8'))).resolves.toBeDefined();
        expect(notFound).not.toHaveBeenCalled();
    });

    it('awaria repozytorium pozostaje awarią (nie notFound)', async () => {
        getProductById.mockRejectedValue(new Error('awaria odczytu'));
        await expect(ProductPage(params('8'))).rejects.toThrow('awaria odczytu');
        expect(notFound).not.toHaveBeenCalled();
    });
});

describe('generateMetadata', () => {
    it('tytuł zależy od produktu', async () => {
        getProductById.mockResolvedValue(product);
        expect(await generateMetadata(params('8'))).toEqual({ title: 'Testowy dysk' });
    });

    it('awaria repozytorium nie jest zamieniana na „brak produktu”', async () => {
        getProductById.mockRejectedValue(new Error('awaria odczytu'));
        await expect(generateMetadata(params('8'))).rejects.toThrow('awaria odczytu');
    });
});