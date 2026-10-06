import Link from 'next/link';

export default function ProductSectionLayout({ children }: { children: React.ReactNode }) {
    return (
        <section aria-labelledby="section-title">
            <p id="section-title" className="section-kicker">
                <Link href="/product-list">Katalog produktów</Link>
            </p>
            {children}
        </section>
    );
}