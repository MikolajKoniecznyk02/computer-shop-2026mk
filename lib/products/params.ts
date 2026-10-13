import { z } from 'zod';
import { PRODUCT_TYPES } from './schema';
import type { ProductQuery } from './query';

const querySchema = z.object({
    type: z.enum(PRODUCT_TYPES).optional(),
    sort: z.enum(['name', 'date']).optional(),
    availability: z.enum(['available', 'unavailable']).optional(),
});

export type ParseResult =
    | { ok: true; query: ProductQuery }
    | { ok: false; errors: { param: string; message: string }[] };

export function parseProductQuery(params: URLSearchParams): ParseResult {
    const result = querySchema.safeParse({
        type: params.get('type') ?? undefined,
        sort: params.get('sort') ?? undefined,
        availability: params.get('availability') ?? undefined,
    });

    if (!result.success) {
        return {
            ok: false,
            errors: result.error.issues.map((i) => ({
                param: String(i.path[0] ?? ''),
                message: i.message,
            })),
        };
    }
    return { ok: true, query: result.data };
}