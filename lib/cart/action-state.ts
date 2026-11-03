import type { CartErrorCode } from './types';

export type ActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; code: CartErrorCode; message: string; field?: 'quantity' | 'productId' | 'itemId' };

export const IDLE: ActionState = { status: 'idle' };