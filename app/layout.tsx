import type { Metadata } from 'next';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import './globals.css';
import UserMenu from '@/components/UserMenu';

export const metadata: Metadata = {
  title: {
    default: 'Sklep komputerowy 2026',
    template: '%s | Sklep komputerowy 2026',
  },
  description: 'Projekt sklepu komputerowego w Next.js – Programowanie BackEnd, Politechnika Krakowska.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <a href="#main" className="skip-link">Przejdź do treści</a>
        <header className="site-header">
          <Link href="/" className="brand">Sklep komputerowy 2026</Link>
          <nav aria-label="Główna nawigacja">
            <NavLinks />
          </nav>
          <UserMenu />
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p>© 2026 Sklep komputerowy · Programowanie BackEnd · Politechnika Krakowska</p>
        </footer>
      </body>
    </html>
  );
}