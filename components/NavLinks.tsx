'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAriaCurrent } from '@/lib/nav';

const links = [
    { href: '/', label: 'Start' },
    { href: '/product-list', label: 'Produkty' },
    { href: '/basket', label: 'Koszyk' },
    { href: '/order-history', label: 'Historia zamówień' },
    { href: '/about', label: 'O sklepie' },
];

export default function NavLinks() {
    const pathname = usePathname();
    return (
        <ul className="nav-list">
            {links.map(({ href, label }) => (
                <li key={href}>
                    <Link href={href} aria-current={getAriaCurrent(href, pathname)}>
                        {label}
                    </Link>
                </li>
            ))}
        </ul>
    );
}