import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Historia zamówień' };

export default function OrderHistoryPage() {
    return (
        <>
            <h1>Historia zamówień</h1>
            <p className="status-box" role="status">Historia nie została jeszcze zaimplementowana.</p>
        </>
    );
}