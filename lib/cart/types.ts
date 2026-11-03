export const MAX_QUANTITY = 99;

export type CartErrorCode =
    | 'UNAUTHENTICATED'
    | 'INVALID_INPUT'
    | 'NOT_FOUND'
    | 'OUT_OF_STOCK'
    | 'LIMIT'
    | 'EMPTY_CART'
    | 'CONFLICT'
    | 'UNAVAILABLE';

export type CartResult<T = undefined> =
    | { ok: true; data: T }
    | { ok: false; code: CartErrorCode; message: string; field?: 'quantity' | 'productId' | 'itemId' };

export const ok = <T>(data: T): CartResult<T> => ({ ok: true, data });
export const fail = (
    code: CartErrorCode,
    message: string,
    field?: 'quantity' | 'productId' | 'itemId',
): CartResult<never> => ({ ok: false, code, message, field });

/** Tylko pola potrzebne widokowi. Bez tokenów, bez rekordów auth. */
export type CartLineView = {
    id: number;
    productId: number;
    name: string;
    image: string;
    unitPrice: number; // grosze, z aktualnej ceny produktu
    quantity: number;
    lineTotal: number; // grosze
    available: number; // aktualny stan produktu
    problem: null | 'OUT_OF_STOCK' | 'EXCEEDS_STOCK';
};

export type CartView = { items: CartLineView[]; itemCount: number; total: number };