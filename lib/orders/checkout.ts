import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { ok, fail, type CartResult } from '@/lib/cart/types';

type Placed = { orderNumber: string; replayed: boolean };

/** Rzucany w transakcji, aby ją wycofać (stan, cena). Nie jest awarią systemu. */
class CheckoutConflict extends Error {
    constructor(
        readonly code: 'OUT_OF_STOCK' | 'CONFLICT',
        message: string,
    ) {
        super(message);
    }
}

const isUniqueViolation = (e: unknown) =>
    typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 'P2002';

export async function checkoutForUser(userId: string, requestKey: string): Promise<CartResult<Placed>> {
    const prisma = getPrisma();
    try {
        return await prisma.$transaction(
            async (tx): Promise<CartResult<Placed>> => {
                //Blokada wiersza koszyka właściciela
                const carts = await tx.$queryRaw<{ id: number }[]>`
          SELECT "id" FROM "Cart" WHERE "userId" = ${userId} FOR UPDATE`;

                const existing = await tx.order.findFirst({ where: { userId, requestKey }, select: { number: true } });
                if (existing) return ok({ orderNumber: existing.number, replayed: true });

                if (carts.length === 0) return fail('EMPTY_CART', 'Koszyk jest pusty.');
                const cartId = carts[0].id;

                //Blokada pozycji koszyka
                await tx.$queryRaw`SELECT "id" FROM "CartItem" WHERE "cartId" = ${cartId} FOR UPDATE`;
                const items = await tx.cartItem.findMany({
                    where: { cartId },
                    orderBy: { productId: 'asc' }, // stała kolejność blokad produktów = brak zakleszczeń między użytkownikami
                    include: { product: { select: { code: true, name: true, price: true } } },
                });
                if (items.length === 0) return fail('EMPTY_CART', 'Koszyk jest pusty.');

                // 4) Warunkowe zmniejszenie stanu: warunek wystarczającego stanu i niezmienionej ceny jest w tym samym UPDATE.
                for (const item of items) {
                    const updated = await tx.product.updateMany({
                        where: { id: item.productId, amount: { gte: item.quantity }, price: item.product.price },
                        data: { amount: { decrement: item.quantity } },
                    });
                    if (updated.count !== 1) {
                        const now = await tx.product.findUnique({
                            where: { id: item.productId },
                            select: { amount: true, price: true },
                        });
                        const name = item.product.name;
                        if (now && now.price !== item.product.price) {
                            throw new CheckoutConflict('CONFLICT', `Cena produktu „${name}” właśnie się zmieniła. Sprawdź koszyk i spróbuj ponownie.`);
                        }
                        throw new CheckoutConflict(
                            'OUT_OF_STOCK',
                            now && now.amount > 0 ? `Produkt „${name}”: dostępne tylko ${now.amount} szt.` : `Produkt „${name}” jest niedostępny.`,
                        );
                    }
                }

                //Numer z sekwencji
                const seq = await tx.$queryRaw<{ n: number }[]>`SELECT nextval('order_number_seq')::int AS n`;
                const number = `ZAM-${new Date().getUTCFullYear()}-${String(seq[0].n).padStart(4, '0')}`;

                const lines = items.map((item, index) => ({
                    position: index + 1,
                    productId: item.productId,
                    productCode: item.product.code,
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    lineTotal: BigInt(item.product.price) * BigInt(item.quantity),
                }));
                const totalPrice = lines.reduce((sum, l) => sum + l.lineTotal, BigInt(0));

                const order = await tx.order.create({
                    data: { number, userId, requestKey, status: 'PENDING', totalPrice, items: { create: lines } },
                    select: { number: true },
                });

                await tx.cartItem.deleteMany({ where: { cartId } });

                return ok({ orderNumber: order.number, replayed: false });
            },
            { timeout: 15_000 },
        );
    } catch (e) {
        if (e instanceof CheckoutConflict) return fail(e.code, e.message); 
        if (isUniqueViolation(e)) {
            // ostatnia siatka bezpieczeństwa dla duplikatu klucza
            const existing = await prisma.order.findFirst({ where: { userId, requestKey }, select: { number: true } });
            if (existing) return ok({ orderNumber: existing.number, replayed: true });
        }
        throw e;
    }
}