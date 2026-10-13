import { z } from 'zod';

export const PRODUCT_TYPES = ['cpu', 'gpu', 'ram', 'disk'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const productSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().regex(/^[A-Z0-9]{10}$/, 'code: 10 wielkich liter ASCII lub cyfr'),
  name: z.string().trim().min(1),
  type: z.enum(PRODUCT_TYPES),
  price: z.number().int().nonnegative(),
  amount: z.number().int().nonnegative(),
  description: z.string(),
  date: z.iso.datetime(),
  image: z.string().regex(/^\/images\/products\/[\w-]+\.png$/),
});

export type Product = z.infer<typeof productSchema>;

export function validateProducts(data: unknown): Product[] {
  const products = z.array(productSchema).parse(data);
  const ids = new Set<number>();
  const codes = new Set<string>();
  for (const p of products) {
    if (ids.has(p.id)) throw new Error(`Zduplikowany id: ${p.id}`);
    if (codes.has(p.code)) throw new Error(`Zduplikowany code: ${p.code}`);
    ids.add(p.id);
    codes.add(p.code);
  }
  return products;
}
