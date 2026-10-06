import Image from 'next/image';
import type { Product } from '@/lib/products/schema';

const TYPE_LABELS = { cpu: 'Procesor', gpu: 'Karta graficzna', ram: 'Pamięć RAM', disk: 'Dysk' } as const;

const priceFormat = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

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
            <h3>{product.name}</h3>
            <dl>
                <dt>Kategoria</dt><dd>{TYPE_LABELS[product.type]}</dd>
                <dt>Cena</dt><dd>{priceFormat.format(product.price / 100)}</dd>
                <dt>Dostępność</dt>
                <dd className={available ? 'badge-ok' : 'badge-no'}>
                    {available ? `Dostępny (${product.amount} szt.)` : 'Niedostępny'}
                </dd>
            </dl>
        </li>
    );
}