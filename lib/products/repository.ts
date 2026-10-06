import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateProducts, type Product } from './schema';
import { queryProducts, type ProductQuery } from './query';

let cache: Promise<Product[]> | null = null;

function load(): Promise<Product[]> {
    cache ??= readFile(path.join(process.cwd(), 'data', 'products.json'), 'utf-8')
        .then((text) => validateProducts(JSON.parse(text)))
        .catch((err) => {
            cache = null; // pozwala ponowić po błędzie
            throw err;
        });
    return cache;
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
    return queryProducts(await load(), query);
}

/** Zwraca produkt albo null, gdy id nie istnieje. */
export async function getProductById(id: number): Promise<Product | null> {
    const all = await load();
    return all.find((p) => p.id === id) ?? null;
}