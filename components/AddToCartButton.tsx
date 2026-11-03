'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { addToCartAction } from '@/app/basket/actions';
import { IDLE } from '@/lib/cart/action-state';

export default function AddToCartButton({ productId, amount }: { productId: number; amount: number }) {
    const [state, formAction, pending] = useActionState(addToCartAction, IDLE);

    return (
        <form action={formAction} className="add-to-cart">
            <input type="hidden" name="productId" value={productId} />
            <button type="submit" disabled={pending || amount === 0}>
                {pending ? 'Dodawanie…' : amount === 0 ? 'Niedostępny' : 'Dodaj do koszyka'}
            </button>
            <p role="status" aria-live="polite" className="form-message">
                {state.status === 'success' && (
                    <>
                        {state.message} <Link href="/basket">Przejdź do koszyka</Link>
                    </>
                )}
                {state.status === 'error' && (
                    <>
                        {state.message}
                        {state.code === 'UNAUTHENTICATED' && <> <Link href="/basket">Zaloguj się</Link></>}
                    </>
                )}
            </p>
        </form>
    );
}