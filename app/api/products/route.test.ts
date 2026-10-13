import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { NextRequest } from 'next/server';
import { GET } from './route';

const call = (qs = '') => GET(new NextRequest(`http://localhost/api/products${qs}`));

describe('GET /api/products', () => {
    it('200 i 100 produktów bez filtrów', async () => {
        const res = await call();
        expect(res.status).toBe(200);
        expect(await res.json()).toHaveLength(100);
    });

    it('filtr kategorii zwraca tylko tę kategorię', async () => {
        const data = await (await call('?type=gpu')).json();
        expect(data.length).toBeGreaterThan(0);
        expect(data.every((p: { type: string }) => p.type === 'gpu')).toBe(true);
    });

    it('sortowanie po nazwie rosnąco', async () => {
        const data: { name: string }[] = await (await call('?sort=name')).json();
        const names = data.map((p) => p.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pl')));
    });

    it('400 dla błędnej wartości', async () => {
        const res = await call('?type=monitor');
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBeDefined();
    });

    it('200 i [] dla poprawnego zapytania bez wyników', async () => {
        const res = await call('?type=cpu&availability=unavailable');
        expect(res.status).toBe(200);
        expect(Array.isArray(await res.json())).toBe(true);
    });
});