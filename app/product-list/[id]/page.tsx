import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/products/repository';
import { parseProductId } from '@/lib/products/id';
import { TYPE_LABELS, formatPrice, formatDate } from '@/lib/products/format'

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
    const products = await getProducts({ sort: 'name' });
    return products.filter((p) => p.id <= 10).map((p) => ({ id: String(p.id) }));
}

export const dynamicParams = true;

//export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {

    const { id: rawId } = await params;
    const id = parseProductId(rawId);
    if (id === null) return { title: 'Nie znaleziono produktu' };

    //test awarii szczegółów
    //if (id === 5) throw new Error('TEST: awaria metadanych');

    // Bez try/catch: awaria repozytorium MA pozostać awarią, a nie „brakiem produktu”.
    const product = await getProductById(id);
    return { title: product ? product.name : 'Nie znaleziono produktu' };
}

export default async function ProductPage({ params }: Props) {
    const { id: rawId } = await params;

    const id = parseProductId(rawId);
    if (id === null) notFound(); // zły format lub zakres

    // test awarii metadanych
    //if (id === 5) throw new Error('TEST: awaria szczegółów');

    const product = await getProductById(id);
    if (product === null) notFound();

    const available = product.amount > 0;

    return (
        <article>
            <p><Link href="/product-list">← Wróć do katalogu</Link></p>
            <h1>{product.name}</h1>
            <Image
                src={product.image}
                alt={`${TYPE_LABELS[product.type]} – grafika poglądowa`}
                width={400}
                height={400}
                sizes="(max-width: 600px) 100vw, 400px"
                style={{ maxWidth: '100%', height: 'auto' }}
            />
            <dl className="detail-list">
                <dt>Kod</dt><dd>{product.code}</dd>
                <dt>Kategoria</dt><dd>{TYPE_LABELS[product.type]}</dd>
                <dt>Opis</dt><dd>{product.description}</dd>
                <dt>Cena</dt><dd>{formatPrice(product.price)}</dd>
                <dt>Stan magazynowy</dt>
                <dd className={available ? 'badge-ok' : 'badge-no'}>
                    {available ? `${product.amount} szt.` : 'Niedostępny (0 szt.)'}
                </dd>
                <dt>Data</dt><dd>{formatDate(product.date)}</dd>
            </dl>
        </article>
    );
}