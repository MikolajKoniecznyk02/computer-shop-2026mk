import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'O sklepie' };

export default function AboutPage() {
    return (
        <>
            <h1>O sklepie</h1>
            <p>Sklep oferuje procesory, karty graficzne, pamięci RAM i dyski. Dane produktów są generowane deterministycznie i nie pochodzą z prawdziwej oferty.</p>
            <h2>O projekcie</h2>
            <p>Wersja Lab 06: routing, układ, repozytorium danych tylko do odczytu oraz obsługa pustego wyniku, braku zasobu i awarii. Technologie: Next.js 16 (App Router), TypeScript, ESLint.</p>
        </>
    );
}