import { describe, it, expect } from 'vitest';
import { parseCatalogParams, toProductQuery, DEFAULT_CRITERIA } from './catalog-params';

describe('parseCatalogParams', () => {
    it('poprawna kombinacja', () => {
        const r = parseCatalogParams({ type: 'gpu', stock: 'available', sort: 'newest' });
        expect(r.criteria).toEqual({ type: 'gpu', stock: 'available', sort: 'newest' });
        expect(r.warnings).toEqual([]);
    });

    it('brak wartości → domyślne, bez komunikatu', () => {
        const r = parseCatalogParams({});
        expect(r.criteria).toEqual(DEFAULT_CRITERIA);
        expect(r.warnings).toEqual([]);
    });

    it('nieznana wartość → domyślna + komunikat, reszta zachowana', () => {
        const r = parseCatalogParams({ type: 'monitor', sort: 'newest' });
        expect(r.criteria).toEqual({ type: 'all', stock: 'all', sort: 'newest' });
        expect(r.warnings).toHaveLength(1);
    });

    it('pusty tekst → domyślna + komunikat', () => {
        const r = parseCatalogParams({ stock: '' });
        expect(r.criteria.stock).toBe('all');
        expect(r.warnings).toHaveLength(1);
    });

    it('powtórzony klucz (przykład z instrukcji)', () => {
        const r = parseCatalogParams({ type: ['gpu', 'cpu'], sort: 'newest' });
        expect(r.criteria).toEqual({ type: 'all', stock: 'all', sort: 'newest' });
        expect(r.warnings).toHaveLength(1);
    });

    it('wielkość liter ma znaczenie', () => {
        expect(parseCatalogParams({ type: 'GPU' }).warnings).toHaveLength(1);
    });

    it('nieznane nazwy parametrów są ignorowane', () => {
        const r = parseCatalogParams({ foo: 'bar', type: 'ram' });
        expect(r.criteria.type).toBe('ram');
        expect(r.warnings).toEqual([]);
    });
});

describe('toProductQuery', () => {
    it('mapuje all na brak filtra, newest na date', () => {
        expect(toProductQuery({ type: 'all', stock: 'all', sort: 'newest' }))
            .toEqual({ type: undefined, availability: undefined, sort: 'date' });
        expect(toProductQuery({ type: 'cpu', stock: 'unavailable', sort: 'name' }))
            .toEqual({ type: 'cpu', availability: 'unavailable', sort: 'name' });
    });
});