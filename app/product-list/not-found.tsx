import Link from 'next/link';

export default function ProductNotFound() {
    return (
        <div className="status-box" role="status">
            <h1>Nie znaleziono produktu</h1>
            <p>Produkt o podanym identyfikatorze nie istnieje.</p>
            <p><Link href="/product-list">Wróć do katalogu produktów</Link></p>
        </div>
    );
}