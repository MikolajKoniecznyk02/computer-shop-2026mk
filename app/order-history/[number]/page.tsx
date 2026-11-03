import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SignInButton from '@/components/SignInButton';
import { getMyOrder } from '@/lib/orders/access';
import { STATUS_LABELS } from '@/lib/orders/types';
import { formatDateTime, formatPrice } from '@/lib/products/format';

export const metadata: Metadata = { title: 'Zamówienie' };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const result = await getMyOrder(number);

  if (result.status === 'unauthenticated') {
    return (
      <div className="status-box" role="status">
        <p>Aby zobaczyć zamówienie, zaloguj się.</p>
        <SignInButton />
      </div>
    );
  }
  if (result.status === 'not-found') notFound(); // cudze, nieistniejące i błędny format: ten sam widok

  const o = result.order;
  return (
    <article>
      <p><Link href="/order-history">← Wróć do historii</Link></p>
      <h1>Zamówienie {o.number}</h1>
      <p>{formatDateTime(o.createdAt)} · {STATUS_LABELS[o.status]}</p>

      <div className="table-scroll">
        <table className="order-table">
          <caption>Pozycje zamówienia (ceny z chwili zakupu)</caption>
          <thead>
            <tr>
              <th scope="col">Produkt</th>
              <th scope="col">Kod</th>
              <th scope="col">Ilość</th>
              <th scope="col">Cena jedn.</th>
              <th scope="col">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {o.lines.map((l) => (
              <tr key={l.position}>
                <td>{l.productId !== null ? <Link href={`/product-list/${l.productId}`}>{l.name}</Link> : l.name}</td>
                <td>{l.code}</td>
                <td>{l.quantity}</td>
                <td>{formatPrice(l.unitPrice)}</td>
                <td>{formatPrice(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="basket-total">Suma: {formatPrice(o.total)}</p>
    </article>
  );
}