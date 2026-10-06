'use client';

import { useEffect } from 'react';

type Props = {
    error: Error & { digest?: string };
    reset: () => void;
    unstable_retry?: () => void; // nowsze API – sprawdź dokumentację 16.3
};

export default function ProductListError({ error, reset, unstable_retry }: Props) {
    useEffect(() => {
        console.error(error); // w produkcji message jest ukrywany, zostaje digest
    }, [error]);

    const retry = unstable_retry ?? reset;

    return (
        <div role="alert" className="status-box">
            <h1>Coś poszło nie tak</h1>
            <p>Nie udało się załadować katalogu produktów. Spróbuj ponownie za chwilę.</p>
            <button type="button" onClick={() => retry()}>Spróbuj ponownie</button>
        </div>
    );
}