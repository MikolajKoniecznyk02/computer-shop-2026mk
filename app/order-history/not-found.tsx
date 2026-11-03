import Link from 'next/link';

export default function OrderNotFound() {
    return (
        <div className="status-box" role="status">
            <h1>Nie znaleziono zamówienia</h1>
            <p>Takie zamówienie nie istnieje na Twoim koncie.</p>
            <p><Link href="/order-history">Wróć do historii zamówień</Link></p>
        </div>
    );
}