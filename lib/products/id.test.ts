import { describe, it, expect } from 'vitest';
import { parseProductId } from './id';

describe('parseProductId', () => {
    it.each([['1', 1], ['42', 42], ['2147483647', 2147483647]])('akceptuje %s', (raw, n) => {
        expect(parseProductId(raw)).toBe(n);
    });

    it.each([
        'abc', '12abc', '0', '-1', '01', '+1', '1.5', '1e3', ' 1', '1 ', '',
        '2147483648', '99999999999999999999', '9007199254740993',
    ])('odrzuca %j', (raw) => {
        expect(parseProductId(raw)).toBeNull();
    });
});