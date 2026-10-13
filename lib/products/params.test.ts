import { describe, it, expect } from 'vitest';
import { parseProductQuery } from './params';

const p = (qs: string) => parseProductQuery(new URLSearchParams(qs));

describe('parseProductQuery', () => {
    it('brak parametrów → puste zapytanie', () => {
        expect(p('')).toEqual({ ok: true, query: {} });
    });

    it('poprawne parametry', () => {
        expect(p('type=gpu&sort=date&availability=available')).toEqual({
            ok: true,
            query: { type: 'gpu', sort: 'date', availability: 'available' },
        });
    });

    it('błędna kategoria → błąd', () => {
        const r = p('type=monitor');
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errors[0].param).toBe('type');
    });

    it('pusta wartość → błąd', () => {
        expect(p('type=').ok).toBe(false);
    });

    it('błędny sort → błąd', () => {
        expect(p('sort=price').ok).toBe(false);
    });

    it('nieznany parametr jest ignorowany', () => {
        expect(p('foo=bar')).toEqual({ ok: true, query: {} });
    });
});