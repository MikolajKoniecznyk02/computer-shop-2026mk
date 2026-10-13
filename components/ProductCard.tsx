import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products/schema';
import { TYPE_LABELS, formatPrice } from '@/lib/products/format';

export default function ProductCard({ product }: { product: Product }) {
    const available = product.amount > 0;
    return (
        <li className="product-card">
            <Image
                src={product.image}
                alt={`${TYPE_LABELS[product.type]} – grafika poglądowa`}
                width={400}
                height={400}
                sizes="(max-width: 600px) 100vw, 256px"
            />
            <h3>
                <Link href={`/product-list/${product.id}`}>{product.name}</Link>
            </h3>
            <dl>
                <dt>Kategoria</dt><dd>{TYPE_LABELS[product.type]}</dd>
                <dt>Cena</dt><dd>{formatPrice(product.price)}</dd>
                <dt>Dostępność</dt>
                <dd className={available ? 'badge-ok' : 'badge-no'}>
                    {available ? `Dostępny (${product.amount} szt.)` : 'Niedostępny'}
                </dd>
            </dl>
        </li>
    );
}