import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));

import { queryProducts } from './query';
import { validateProducts, type Product } from './schema';

const make = (o: Partial<Product>): Product => ({
    id: 1, code: 'AAAAAAAAA1', name: 'A', type: 'cpu', price: 100, amount: 1,
    description: 'x', date: '2026-01-01T10:00:00Z', image: '/images/products/cpu.webp', ...o,
});

describe('sortowanie', () => {
    it('nie zmienia danych wejściowych', () => {
        const input = [make({ id: 1, name: 'Zeta' }), make({ id: 2, code: 'AAAAAAAAA2', name: 'Alfa' })];
        const snapshot = structuredClone(input);
        const out = queryProducts(input, { sort: 'name' });
        expect(input).toEqual(snapshot);
        expect(out.map((p) => p.name)).toEqual(['Alfa', 'Zeta']);
    });

    it('data malejąco, remis rozstrzyga id rosnąco', () => {
        const a = make({ id: 2, code: 'AAAAAAAAA2', date: '2026-05-01T10:00:00Z' });
        const b = make({ id: 1, date: '2026-05-01T10:00:00Z' });
        const c = make({ id: 3, code: 'AAAAAAAAA3', date: '2026-06-01T10:00:00Z' });
        expect(queryProducts([a, b, c], { sort: 'date' }).map((p) => p.id)).toEqual([3, 1, 2]);
    });
});

describe('filtry', () => {
    const data = [make({ id: 1, amount: 0 }), make({ id: 2, code: 'AAAAAAAAA2', amount: 5 })];
    it('dostępne', () => expect(queryProducts(data, { availability: 'available' }).map((p) => p.id)).toEqual([2]));
    it('niedostępne', () => expect(queryProducts(data, { availability: 'unavailable' }).map((p) => p.id)).toEqual([1]));
    it('pusty wynik to pusta tablica', () => expect(queryProducts(data, { type: 'gpu' })).toEqual([]));
});

describe('walidator', () => {
    it('odrzuca duplikat id', () => {
        expect(() => validateProducts([make({}), make({ code: 'AAAAAAAAA2' })])).toThrow(/id/);
    });
    it('odrzuca duplikat code', () => {
        expect(() => validateProducts([make({}), make({ id: 2 })])).toThrow(/code/);
    });
    it('odrzuca ujemną cenę', () => {
        expect(() => validateProducts([make({ price: -1 })])).toThrow();
    });
    it('akceptuje rzeczywisty plik danych', () => {
        const raw = JSON.parse(readFileSync('data/products.json', 'utf-8'));
        const products = validateProducts(raw);
        expect(products).toHaveLength(100);
        expect(new Set(products.map((p) => p.type)).size).toBe(4);
        expect(products.some((p) => p.amount === 0)).toBe(true);
    });
});

// describe('repozytorium', () => {
//     it('brak id → null', async () => expect(await getProductById(999999)).toBeNull());
//     it('znane id → produkt', async () => expect((await getProductById(1))?.id).toBe(1));
//     it('zwraca katalog', async () => expect((await getProducts()).length).toBe(100));
// });

// describe('filtry łącznie na rzeczywistych danych', () => {
//     it('type + stock + sort działają razem', async () => {
//         const r = await getProducts({ type: 'disk', availability: 'unavailable', sort: 'date' });
//         expect(r.length).toBeGreaterThan(0);
//         expect(r.every((p) => p.type === 'disk' && p.amount === 0)).toBe(true);
//         const dates = r.map((p) => p.date);
//         expect(dates).toEqual([...dates].sort().reverse());
//     });
//     it('kombinacja bez wyników → pusta tablica', async () => {
//         expect(await getProducts({ type: 'cpu', availability: 'unavailable' })).toEqual([]);
//     });
// });