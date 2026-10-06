import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Koszyk' };

export default function BasketPage() {
    return (
        <>
            <h1>Koszyk</h1>
            <p className="status-box" role="status">Koszyk nie został jeszcze zaimplementowany.</p>
        </>
    );
}