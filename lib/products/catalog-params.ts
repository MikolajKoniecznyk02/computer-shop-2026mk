import { PRODUCT_TYPES, type ProductType } from './schema';
import type { ProductQuery } from './query';

export type SearchParams = Record<string, string | string[] | undefined>;

export const TYPE_VALUES = ['all', ...PRODUCT_TYPES] as const;
export const STOCK_VALUES = ['all', 'available', 'unavailable'] as const;
export const SORT_VALUES = ['name', 'newest'] as const;

export type CatalogCriteria = {
    type: 'all' | ProductType;
    stock: (typeof STOCK_VALUES)[number];
    sort: (typeof SORT_VALUES)[number];
};

export const DEFAULT_CRITERIA: CatalogCriteria = { type: 'all', stock: 'all', sort: 'name' };

export type ParsedCatalog = { criteria: CatalogCriteria; warnings: string[] };

function read<T extends string>(
    raw: string | string[] | undefined,
    allowed: readonly T[],
    fallback: T,
    label: string,
): { value: T; warning?: string } {
    if (raw === undefined) return { value: fallback }; // brak parametru: bez komunikatu
    if (typeof raw === 'string' && (allowed as readonly string[]).includes(raw)) {
        return { value: raw as T };
    }
    return {
        value: fallback,
        warning: `Pominięto błędne ustawienie: ${label}. Użyto wartości domyślnej.`,
    };
}

export function parseCatalogParams(sp: SearchParams): ParsedCatalog {
    const type = read(sp.type, TYPE_VALUES, DEFAULT_CRITERIA.type, 'kategoria');
    const stock = read(sp.stock, STOCK_VALUES, DEFAULT_CRITERIA.stock, 'dostępność');
    const sort = read(sp.sort, SORT_VALUES, DEFAULT_CRITERIA.sort, 'sortowanie');

    return {
        criteria: { type: type.value, stock: stock.value, sort: sort.value },
        warnings: [type.warning, stock.warning, sort.warning].filter((w): w is string => !!w),
    };
}

// Zamiana zwalidowania kryteriów na zapytania repozytorium.
export function toProductQuery(c: CatalogCriteria): ProductQuery {
    return {
        type: c.type === 'all' ? undefined : c.type,
        availability: c.stock === 'all' ? undefined : c.stock,
        sort: c.sort === 'newest' ? 'date' : 'name', // newest = data malejąco
    };
}