import 'server-only';
import { getCurrentSession } from '@/lib/session';
import {
    addProductForUser, getCartForUser, removeItemForUser, setQuantityForUser,
} from './repository';
import { fail, type CartResult, type CartView } from './types';
import { parseIntId, parseQuantity } from './validation';

const UNAUTH = () => fail('UNAUTHENTICATED', 'Zaloguj się, aby korzystać z koszyka.');

/** JEDYNE miejsce, w którym ustalany jest właściciel koszyka: session.user.id z zapytania do bazy sesji. */
async function currentUserId(): Promise<string | null> {
    const session = await getCurrentSession();
    return session?.user.id ?? null;
}

/** null = brak sesji. Brak rekordu koszyka = pusty widok i suma 0. */
export async function getMyCart(): Promise<CartView | null> {
    const userId = await currentUserId();
    return userId ? getCartForUser(userId) : null;
}

export async function addProduct(productId: unknown): Promise<CartResult<{ quantity: number }>> {
    const userId = await currentUserId();
    if (!userId) return UNAUTH();
    const id = parseIntId(productId);
    if (id === null) return fail('INVALID_INPUT', 'Niepoprawny identyfikator produktu.', 'productId');
    return addProductForUser(userId, id);
}

export async function setQuantity(itemId: unknown, quantity: unknown): Promise<CartResult> {
    const userId = await currentUserId();
    if (!userId) return UNAUTH();
    const id = parseIntId(itemId);
    if (id === null) return fail('INVALID_INPUT', 'Niepoprawny identyfikator pozycji.', 'itemId');
    const qty = parseQuantity(quantity);
    if (qty === null) return fail('INVALID_INPUT', 'Ilość musi być liczbą całkowitą od 1 do 99.', 'quantity');
    return setQuantityForUser(userId, id, qty);
}

export async function removeItem(itemId: unknown): Promise<CartResult> {
    const userId = await currentUserId();
    if (!userId) return UNAUTH();
    const id = parseIntId(itemId);
    if (id === null) return fail('INVALID_INPUT', 'Niepoprawny identyfikator pozycji.', 'itemId');
    return removeItemForUser(userId, id);
}