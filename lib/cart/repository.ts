import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import {
    MAX_QUANTITY, ok, fail,
    type CartLineView, type CartResult, type CartView,
} from './types';

const isUniqueViolation = (e: unknown) =>
    typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 'P2002';

/** Odczyt koszyka właściciela. Brak rekordu Cart = pusty koszyk (nic nie tworzymy przy odczycie). */
export async function getCartForUser(userId: string): Promise<CartView> {
    const cart = await getPrisma().cart.findUnique({
        where: { userId },
        include: {
            items: {
                orderBy: { id: 'asc' },
                include: { product: { select: { id: true, name: true, image: true, price: true, amount: true } } },
            },
        },
    });

    const items: CartLineView[] = (cart?.items ?? []).map((i) => ({
        id: i.id,
        productId: i.product.id,
        name: i.product.name,
        image: i.product.image,
        unitPrice: i.product.price,
        quantity: i.quantity,
        lineTotal: i.product.price * i.quantity, // max 2^31 * 99 ≈ 2,1e11, bezpieczne w Number
        available: i.product.amount,
        problem: i.product.amount === 0 ? 'OUT_OF_STOCK' : i.quantity > i.product.amount ? 'EXCEEDS_STOCK' : null,
    }));

    const total = items.reduce((sum, l) => sum + l.lineTotal, 0);
    if (!Number.isSafeInteger(total)) throw new Error('Suma koszyka poza bezpiecznym zakresem');
    return { items, itemCount: items.reduce((s, l) => s + l.quantity, 0), total };
}

async function ensureCart(prisma: PrismaClient, userId: string) {
    try {
        return await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    } catch (e) {
        if (isUniqueViolation(e)) return prisma.cart.findUniqueOrThrow({ where: { userId } }); // wyścig przy tworzeniu
        throw e;
    }
}

/**
 * Atomowe dodanie jednej sztuki.
 * 1) UPDATE ... WHERE quantity < limit to jedna instrukcja SQL: dwa równoległe żądania nie nadpiszą się.
 * 2) Gdy pozycji nie ma, tworzymy ją; przegrany wyścig (unikalna para) kończy się P2002 i ponowieniem UPDATE.
 */
export async function addProductForUser(userId: string, productId: number): Promise<CartResult<{ quantity: number }>> {
    const prisma = getPrisma();

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { amount: true } });
    if (!product) return fail('NOT_FOUND', 'Nie znaleziono produktu.', 'productId');
    if (product.amount < 1) return fail('OUT_OF_STOCK', 'Produkt jest niedostępny.');

    const limit = Math.min(MAX_QUANTITY, product.amount);
    const cart = await ensureCart(prisma, userId);
    const key = { cartId_productId: { cartId: cart.id, productId } };

    for (let attempt = 0; attempt < 3; attempt++) {
        const updated = await prisma.cartItem.updateMany({
            where: { cartId: cart.id, productId, quantity: { lt: limit } },
            data: { quantity: { increment: 1 } },
        });
        if (updated.count === 1) {
            const item = await prisma.cartItem.findUniqueOrThrow({ where: key, select: { quantity: true } });
            return ok({ quantity: item.quantity });
        }

        const existing = await prisma.cartItem.findUnique({ where: key, select: { quantity: true } });
        if (existing) {
            return existing.quantity >= MAX_QUANTITY
                ? fail('LIMIT', `Maksymalna ilość jednego produktu to ${MAX_QUANTITY}.`, 'quantity')
                : fail('OUT_OF_STOCK', `Dostępne tylko ${product.amount} szt.`, 'quantity');
        }

        try {
            await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: 1 } });
            return ok({ quantity: 1 });
        } catch (e) {
            if (!isUniqueViolation(e)) throw e; // ktoś utworzył pozycję równolegle: ponów UPDATE
        }
    }
    throw new Error('Nie udało się dodać produktu (konflikt współbieżny)');
}

/** Własność i stan są częścią jednego UPDATE, bez osobnego sprawdzenia przed mutacją. */
export async function setQuantityForUser(userId: string, itemId: number, quantity: number): Promise<CartResult> {
    const prisma = getPrisma();
    const updated = await prisma.cartItem.updateMany({
        where: { id: itemId, cart: { userId }, product: { amount: { gte: quantity } } },
        data: { quantity },
    });
    if (updated.count === 1) return ok(undefined);

    const own = await prisma.cartItem.findFirst({
        where: { id: itemId, cart: { userId } },
        select: { product: { select: { amount: true } } },
    });
    if (!own) return fail('NOT_FOUND', 'Nie znaleziono pozycji koszyka.'); // cudza i nieistniejąca: ta sama odmowa
    return fail(
        'OUT_OF_STOCK',
        own.product.amount === 0 ? 'Produkt jest niedostępny.' : `Dostępne tylko ${own.product.amount} szt.`,
        'quantity',
    );
}

export async function removeItemForUser(userId: string, itemId: number): Promise<CartResult> {
    const deleted = await getPrisma().cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
    return deleted.count === 1 ? ok(undefined) : fail('NOT_FOUND', 'Nie znaleziono pozycji koszyka.');
}