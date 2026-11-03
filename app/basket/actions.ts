'use server';

import { revalidatePath } from 'next/cache';
import { addProduct, removeItem, setQuantity } from '@/lib/cart/access';
import type { ActionState } from '@/lib/cart/action-state';
import type { CartResult } from '@/lib/cart/types';
import { redirect } from 'next/navigation';
import { placeOrder } from '@/lib/orders/access';

async function run(op: () => Promise<CartResult<unknown>>, successMessage: string): Promise<ActionState> {
    let result: CartResult<unknown>;
    try {
        result = await op();
    } catch (error) {
        console.error('Błąd operacji koszyka:', error); // szczegóły tylko w logu serwera
        return {
            status: 'error',
            code: 'UNAVAILABLE',
            message: 'Nie udało się zapisać zmian. Spróbuj ponownie później.',
        };
    }
    if (!result.ok) {
        return { status: 'error', code: result.code, message: result.message, field: result.field };
    }
    revalidatePath('/basket'); // świeże dane na widoku koszyka
    return { status: 'success', message: successMessage };
}

// Zamknięty kontrakt: czytamy tylko wskazane pola, nigdy właściciela, ceny ani sumy.
export async function addToCartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    return run(() => addProduct(formData.get('productId')), 'Dodano do koszyka.');
}

export async function setQuantityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    return run(() => setQuantity(formData.get('itemId'), formData.get('quantity')), 'Zapisano ilość.');
}

export async function removeItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    return run(() => removeItem(formData.get('itemId')), 'Usunięto pozycję.');
}

export async function checkoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
        result = await placeOrder(formData.get('requestKey')); // czyta tylko klucz żądania
    } catch (error) {
        console.error('Błąd składania zamówienia:', error);
        return { status: 'error', code: 'UNAVAILABLE', message: 'Nie udało się złożyć zamówienia. Spróbuj ponownie później.' };
    }
    if (!result.ok) {
        return { status: 'error', code: result.code, message: result.message };
    }
    revalidatePath('/basket');
    revalidatePath('/order-history');
    redirect(`/order-history/${result.data.orderNumber}`); // poza try/catch: redirect działa przez wyjątek
}