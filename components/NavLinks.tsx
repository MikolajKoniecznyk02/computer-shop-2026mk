'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
            {links.map(({ href, label }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                    <li key={href}>
                        <Link href={href} aria-current={active ? 'page' : undefined}>
                            {label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}