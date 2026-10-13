import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/products/repository';
import { connection } from 'next/server';

export const metadata: Metadata = { title: 'Produkty' };

export default async function ProductListPage() {
    //await connection();
    //throw new Error('TEST: wymuszona awaria katalogu');

    const products = await getProducts({ sort: 'name' });

    return (
        <>
            <h1>Produkty</h1>
            <p>Sortowanie: nazwa od A do Z. Liczba produktów: {products.length}.</p>

            {products.length === 0 ? (
                <p className="status-box" role="status">Brak produktów do wyświetlenia.</p>
            ) : (
                <ul className="product-grid">
                    {products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </ul>
            )}
        </>
    );
}