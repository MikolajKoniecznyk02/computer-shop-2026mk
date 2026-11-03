import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import type { OrderDetailView, OrderStatusCode, OrderSummaryView } from './types';

function toSafeNumber(value: bigint): number {
    const n = Number(value);
    if (!Number.isSafeInteger(n)) throw new Error('Wartość zamówienia poza bezpiecznym zakresem');
    return n;
}

export async function getOrdersForUser(userId: string): Promise<OrderSummaryView[]> {
    const orders = await getPrisma().order.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { items: { select: { quantity: true } } },
    });
    return orders.map((o) => ({
        number: o.number,
        status: o.status as OrderStatusCode,
        createdAt: o.createdAt.toISOString(),
        total: toSafeNumber(o.totalPrice),
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    }));
}

//Własność jest w tym samym zapytaniu: cudze i nieistniejące zamówienie dają to samo (null).
export async function getOrderForUser(userId: string, number: string): Promise<OrderDetailView | null> {
    const o = await getPrisma().order.findFirst({
        where: { userId, number },
        include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!o) return null;
    return {
        number: o.number,
        status: o.status as OrderStatusCode,
        createdAt: o.createdAt.toISOString(),
        total: toSafeNumber(o.totalPrice),
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        lines: o.items.map((i) => ({
            position: i.position,
            productId: i.productId,
            code: i.productCode,
            name: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: toSafeNumber(i.lineTotal),
        })),
    };
}