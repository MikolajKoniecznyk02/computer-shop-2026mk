'use client';

import { useActionState } from 'react';
import { checkoutAction } from '@/app/basket/actions';
import { IDLE } from '@/lib/cart/action-state';

export default function CheckoutForm({ requestKey, blocked }: { requestKey: string; blocked: boolean }) {
  const [state, formAction, pending] = useActionState(checkoutAction, IDLE);

  return (
    <form action={formAction} className="checkout-form">
      <input type="hidden" name="requestKey" value={requestKey} />
      <button type="submit" disabled={pending || blocked}>
        {pending ? 'Składanie zamówienia…' : 'Złóż zamówienie'}
      </button>
      {blocked && <p>Popraw pozycje oznaczone błędem, aby złożyć zamówienie.</p>}
      {state.status === 'error' && (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      )}
    </form>
  );
}