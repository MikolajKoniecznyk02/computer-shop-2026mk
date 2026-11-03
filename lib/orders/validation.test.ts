import { describe, it, expect } from 'vitest';
import { parseOrderNumber, parseRequestKey } from './validation';

describe('parseRequestKey', () => {
    it('akceptuje UUID', () => {
        expect(parseRequestKey('123e4567-e89b-42d3-a456-426614174000')).toBe('123e4567-e89b-42d3-a456-426614174000');
    });
    it.each(['', 'abc', '123e4567-e89b-42d3-a456-42661417400', '123E4567-E89B-42D3-A456-426614174000', null, undefined, 5])(
        'odrzuca %j',
        (v) => expect(parseRequestKey(v)).toBeNull(),
    );
});

describe('parseOrderNumber', () => {
    it('akceptuje ZAM-2026-1000', () => expect(parseOrderNumber('ZAM-2026-1000')).toBe('ZAM-2026-1000'));
    it.each(['ZAM-26-1000', 'zam-2026-1000', 'ZAM-2026-100', 'ZAM-2026-1000 ', '1', "ZAM-2026-1000'--", null, undefined])(
        'odrzuca %j',
        (v) => expect(parseOrderNumber(v)).toBeNull(),
    );
});