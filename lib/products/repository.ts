import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { PRODUCT_TYPES, type Product } from './schema';
import type { ProductQuery } from './query';

const MAX_ID = 2147483647;

const include = { category: { select: { code: true } } } satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

//transfer modelu bazy na model domenowy.
function toDomain(row: Row): Product {
    const type = PRODUCT_TYPES.find((t) => t === row.category.code);
    if (!type) throw new Error(`Nieznany kod kategorii w bazie: ${row.category.code}`);
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        type,
        price: row.price,
        amount: row.amount,
        description: row.description,
        date: row.date.toISOString(),
        image: row.image,
    };
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
        ...(query.type ? { category: { code: query.type } } : {}),
        ...(query.availability === 'available' ? { amount: { gt: 0 } } : {}),
        ...(query.availability === 'unavailable' ? { amount: 0 } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
        (query.sort ?? 'name') === 'date'
            ? [{ date: 'desc' }, { id: 'asc' }]
            : [{ nameSortKey: 'asc' }, { id: 'asc' }];

    const rows = await getPrisma().product.findMany({ where, orderBy, include });
    return rows.map(toDomain);
}

//Produkt albo null. Awaria bazy rzuca wyjątek.
export async function getProductById(id: number): Promise<Product | null> {
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_ID) return null; // przed zapytaniem
    const row = await getPrisma().product.findUnique({ where: { id }, include });
    return row ? toDomain(row) : null;
}