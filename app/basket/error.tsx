'use client';

import { useEffect } from 'react';

type Props = {
    error: Error & { digest?: string };
    reset: () => void;
    unstable_retry?: () => void;
};

export default function BasketError({ error, reset, unstable_retry }: Props) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    const retry = unstable_retry ?? reset;

    return (
        <div role="alert" className="status-box">
            <h1>Nie udało się wczytać koszyka</h1>
            <p>Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.</p>
            <button type="button" onClick={() => retry()}>Spróbuj ponownie</button>
        </div>
    );
}