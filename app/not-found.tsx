import Link from 'next/link';

export default function NotFound() {
    return (
        <>
            <h1>Nie znaleziono strony</h1>
            <p>Adres, który wpisałeś, nie istnieje.</p>
            <p><Link href="/">Wróć na stronę główną</Link></p>
        </>
    );
}