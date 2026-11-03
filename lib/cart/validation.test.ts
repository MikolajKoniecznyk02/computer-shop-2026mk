import { describe, it, expect } from 'vitest';
import { parseIntId, parseQuantity } from './validation';

describe('parseQuantity', () => {
    it.each([1, 50, 99, '1', '99'])('akceptuje %j', (v) => {
        expect(parseQuantity(v)).toBe(Number(v));
    });
    it.each([0, -1, 1.5, 100, 101, Number.NaN, Infinity, 2 ** 53, '0', '-1', '1.5', '100', '', ' 1', '1e1', '01', 'abc', null, undefined, {}, []])(
        'odrzuca %j',
        (v) => expect(parseQuantity(v)).toBeNull(),
    );
});

describe('parseIntId', () => {
    it.each([1, 42, 2147483647, '1', '2147483647'])('akceptuje %j', (v) => {
        expect(parseIntId(v)).toBe(Number(v));
    });
    it.each([0, -1, 1.5, 2147483648, 2 ** 53, '0', '-1', '01', '12abc', 'abc', '2147483648', '', null, undefined])(
        'odrzuca %j',
        (v) => expect(parseIntId(v)).toBeNull(),
    );
});