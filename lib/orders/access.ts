import 'server-only';
import { currentUserId } from '@/lib/current-user';
import { fail, type CartResult } from '@/lib/cart/types';
import { checkoutForUser } from './checkout';
import { getOrderForUser, getOrdersForUser } from './repository';
import type { OrderDetailView, OrderSummaryView } from './types';
import { parseOrderNumber, parseRequestKey } from './validation';

export type ListResult = { status: 'unauthenticated' } | { status: 'ok'; orders: OrderSummaryView[] };
export type DetailResult =
    | { status: 'unauthenticated' }
    | { status: 'not-found' }
    | { status: 'ok'; order: OrderDetailView };

export async function getMyOrders(): Promise<ListResult> {
    const userId = await currentUserId();
    if (!userId) return { status: 'unauthenticated' };
    return { status: 'ok', orders: await getOrdersForUser(userId) };
}

export async function getMyOrder(rawNumber: unknown): Promise<DetailResult> {
    const userId = await currentUserId();
    if (!userId) return { status: 'unauthenticated' };
    const number = parseOrderNumber(rawNumber);
    if (number === null) return { status: 'not-found' };
    const order = await getOrderForUser(userId, number);
    return order ? { status: 'ok', order } : { status: 'not-found' };
}

// Złożenie zamówienia z koszyka właściciela. Przyjmuje tylko klucz żądania.
export async function placeOrder(requestKey: unknown): Promise<CartResult<{ orderNumber: string; replayed: boolean }>> {
    const userId = await currentUserId();
    if (!userId) return fail('UNAUTHENTICATED', 'Zaloguj się, aby złożyć zamówienie.');
    const key = parseRequestKey(requestKey);
    if (key === null) return fail('INVALID_INPUT', 'Niepoprawne żądanie. Odśwież stronę i spróbuj ponownie.');
    return checkoutForUser(userId, key);
}