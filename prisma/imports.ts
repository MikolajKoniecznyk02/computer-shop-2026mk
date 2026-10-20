import type { PrismaClient } from '../lib/generated/prisma/client';
import type { Product } from '../lib/products/schema';
import { computeNameSortKey } from '../lib/products/sort-keys';

export const CATEGORIES = [
    { code: 'cpu', name: 'Procesory' },
    { code: 'gpu', name: 'Karty graficzne' },
    { code: 'ram', name: 'Pamięci RAM' },
    { code: 'disk', name: 'Dyski' },
] as const;

//Zapis katalogu produktów do bazy danych.
export async function importCatalog(prisma: PrismaClient, products: readonly Product[]) {
    await prisma.$transaction(
        async (tx) => {
            const categoryIds = new Map<string, number>();
            for (const c of CATEGORIES) {
                const row = await tx.category.upsert({
                    where: { code: c.code },
                    update: { name: c.name },
                    create: c,
                });
                categoryIds.set(c.code, row.id);
            }

            for (const p of products) {
                const categoryId = categoryIds.get(p.type);
                if (categoryId === undefined) throw new Error(`Nieznana kategoria: ${p.type}`);
                const data = {
                    code: p.code,
                    name: p.name,
                    nameSortKey: computeNameSortKey(p.name),
                    description: p.description,
                    image: p.image,
                    price: p.price,
                    amount: p.amount,
                    date: new Date(p.date),
                    categoryId,
                };
                await tx.product.upsert({
                    where: { id: p.id },
                    update: data,
                    create: { id: p.id, ...data },
                });
            }
        },
        { timeout: 60_000 },
    );
}