import { describe, it, expect } from 'vitest';
import { getAriaCurrent } from './nav';

describe('getAriaCurrent', () => {
    it('dokładna strona → page', () => expect(getAriaCurrent('/product-list', '/product-list')).toBe('page'));
    it('podstrona sekcji → true', () => expect(getAriaCurrent('/product-list', '/product-list/5')).toBe('true'));
    it('podobna ścieżka → brak', () => expect(getAriaCurrent('/product-list', '/product-list-old')).toBeUndefined());
    it('strona główna tylko dokładnie', () => {
        expect(getAriaCurrent('/', '/')).toBe('page');
        expect(getAriaCurrent('/', '/about')).toBeUndefined();
    });
});