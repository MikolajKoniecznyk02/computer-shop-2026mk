import type { Metadata } from 'next';
import Link from 'next/link';
import SignInButton from '@/components/SignInButton';
import { getMyOrders } from '@/lib/orders/access';
import { STATUS_LABELS } from '@/lib/orders/types';
import { formatDateTime, formatPrice } from '@/lib/products/format';

export const metadata: Metadata = { title: 'Historia zamówień' };

export default async function OrderHistoryPage() {
    const result = await getMyOrders(); // wyjątek (awaria bazy) trafia do error.tsx

    if (result.status === 'unauthenticated') {
        return (
            <>
                <h1>Historia zamówień</h1>
                <div className="status-box" role="status">
                    <p>Aby zobaczyć swoje zamówienia, zaloguj się.</p>
                    <SignInButton />
                </div>
            </>
        );
    }

    return (
        <>
            <h1>Historia zamówień</h1>
            {result.orders.length === 0 ? (
                <div className="status-box" role="status">
                    <p>Nie masz jeszcze zamówień.</p>
                    <p><Link href="/product-list">Przejdź do katalogu</Link></p>
                </div>
            ) : (
                <ul className="order-list">
                    {result.orders.map((o) => (
                        <li key={o.number} className="order-card">
                            <h2><Link href={`/order-history/${o.number}`}>{o.number}</Link></h2>
                            <p>
                                {formatDateTime(o.createdAt)} · {STATUS_LABELS[o.status]} · {o.itemCount} szt. ·{' '}
                                <strong>{formatPrice(o.total)}</strong>
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}