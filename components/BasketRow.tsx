'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { removeItemAction, setQuantityAction } from '@/app/basket/actions';
import { IDLE } from '@/lib/cart/action-state';
import type { CartLineView } from '@/lib/cart/types';
import { formatPrice } from '@/lib/products/format';

export default function BasketRow({ item }: { item: CartLineView }) {
    const [qtyState, qtyAction, qtyPending] = useActionState(setQuantityAction, IDLE);
    const [rmState, rmAction, rmPending] = useActionState(removeItemAction, IDLE);

    const qtyError = qtyState.status === 'error' ? qtyState : null;
    const inputId = `qty-${item.id}`;
    const errorId = `qty-error-${item.id}`;

    return (
        <li className="basket-row">
            <Image src={item.image} alt="" width={64} height={64} />
            <div>
                <h2>{item.name}</h2>
                <p>
                    Cena jednostkowa: {formatPrice(item.unitPrice)} · Wartość: <strong>{formatPrice(item.lineTotal)}</strong>
                </p>

                {item.problem && (
                    <p role="alert" className="field-error">
                        {item.problem === 'OUT_OF_STOCK'
                            ? 'Ten produkt jest już niedostępny. Usuń pozycję z koszyka.'
                            : `W magazynie jest tylko ${item.available} szt. Zmniejsz ilość lub usuń pozycję.`}
                    </p>
                )}

                <form action={qtyAction} noValidate>
                    <input type="hidden" name="itemId" value={item.id} />
                    <label htmlFor={inputId}>Ilość</label>
                    <input
                        id={inputId}
                        name="quantity"
                        type="number"
                        inputMode="numeric"
                        defaultValue={item.quantity}
                        aria-invalid={qtyError?.field === 'quantity' || undefined}
                        aria-describedby={qtyError ? errorId : undefined}
                    />
                    <button type="submit" disabled={qtyPending}>
                        {qtyPending ? 'Zapisywanie…' : 'Zapisz ilość'}
                    </button>
                    {qtyError && (
                        <span id={errorId} role="alert" className="field-error">
                            {qtyError.message}
                        </span>
                    )}
                </form>

                <form action={rmAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="secondary" disabled={rmPending}>
                        {rmPending ? 'Usuwanie…' : 'Usuń'}
                    </button>
                    {rmState.status === 'error' && (
                        <span role="alert" className="field-error">
                            {rmState.message}
                        </span>
                    )}
                </form>
            </div>
        </li>
    );
}