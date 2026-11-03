import type { Metadata } from 'next';
import BasketRow from '@/components/BasketRow';
import SignInButton from '@/components/SignInButton';
import { getMyCart } from '@/lib/cart/access';
import { formatPrice } from '@/lib/products/format';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata: Metadata = { title: 'Koszyk' };

export default async function BasketPage() {
    // Odczyt sesji przez headers() sam czyni stronę dynamiczną; wynik jest prywatny i nie jest buforowany.
    const cart = await getMyCart(); // null = brak sesji; wyjątek (awaria bazy) trafia do error.tsx

    if (cart === null) {
        return (
            <>
                <h1>Koszyk</h1>
                <div className="status-box" role="status">
                    <p>Aby korzystać z koszyka, zaloguj się.</p>
                    <SignInButton />
                </div>
            </>
        );
    }

    return (
        <>
            <h1>Koszyk</h1>
            {cart.items.length === 0 ? (
                <p className="status-box" role="status">
                    Twój koszyk jest pusty. Suma: {formatPrice(0)}.
                </p>
            ) : (
                <ul className="basket-list">
                    {cart.items.map((item) => (
                        <BasketRow key={item.id} item={item} />
                    ))}
                </ul>
            )}

            <p className="basket-total">
                Suma: {formatPrice(cart.total)} ({cart.itemCount} szt.)
            </p>
            {cart.items.length > 0 && (
                <CheckoutForm
                    requestKey={crypto.randomUUID()}
                    blocked={cart.items.some((i) => i.problem !== null)}
                />
            )}
            <p id="checkout-note">Składanie zamówień nie jest jeszcze dostępne.</p>
        </>
    );
}