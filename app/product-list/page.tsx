import type { Metadata } from 'next';
import Link from 'next/link';
import CatalogFilters from '@/components/CatalogFilters';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/products/repository';
import {
    parseCatalogParams,
    toProductQuery,
    type SearchParams,
} from '@/lib/products/catalog-params';

export const metadata: Metadata = { title: 'Produkty' };

export default async function ProductListPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const { criteria, warnings } = parseCatalogParams(sp);
    const products = await getProducts(toProductQuery(criteria));

    return (
        <>
            <h1>Produkty</h1>

            <CatalogFilters criteria={criteria} />

            {warnings.length > 0 && (
                <div className="status-box warning" role="status">
                    <ul>
                        {warnings.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                </div>
            )}

            <p>Liczba produktów: {products.length}.</p>

            {products.length === 0 ? (
                <div className="status-box" role="status">
                    <p>Brak produktów spełniających wybrane kryteria.</p>
                    <p><Link href="/product-list">Wyczyść filtry</Link></p>
                </div>
            ) : (
                <ul className="product-grid">
                    {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </ul>
            )}
        </>
    );
}