import { describe, it, expect } from 'vitest';
import { computeNameSortKey, compareUtf8 } from './sort-keys';
import { queryProducts } from './query';
import { make } from '@/tests/helpers';

describe('klucz nazwy', () => {
    it('ignoruje wielkość liter i spacje na brzegach', () => {
        expect(computeNameSortKey('  Abc ')).toBe('abc');
    });
    it('porównuje bajty UTF-8: ASCII przed polskimi znakami', () => {
        expect(compareUtf8('zebra', 'ąbc')).toBeLessThan(0);
        expect(compareUtf8('ćma', 'łódź')).toBeLessThan(0);
    });
    it('zestaw z polskimi znakami i remisami (referencja w pamięci)', () => {
        const data = [
            make({ id: 1, code: 'AAAAAAAAA1', name: 'Zebra' }),
            make({ id: 2, code: 'AAAAAAAAA2', name: 'Abc' }),
            make({ id: 3, code: 'AAAAAAAAA3', name: 'abc' }),
            make({ id: 4, code: 'AAAAAAAAA4', name: 'Żółw' }),
            make({ id: 5, code: 'AAAAAAAAA5', name: 'ąbc' }),
        ];
        expect(queryProducts(data, { sort: 'name' }).map((p) => p.id)).toEqual([2, 3, 1, 5, 4]);
    });
});