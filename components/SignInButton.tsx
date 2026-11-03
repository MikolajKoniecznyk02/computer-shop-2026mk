'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

// Adres powrotu jest stałą w kodzie, nie wartością z formularza ani z adresu (brak open redirect).
const RETURN_PATH = '/basket';

export default function SignInButton({ label = 'Zaloguj przez GitHub' }: { label?: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onClick() {
        setPending(true);
        setError(null);
        const { error } = await authClient.signIn.social({
            provider: 'github',
            callbackURL: RETURN_PATH,
            errorCallbackURL: RETURN_PATH,
        });
        if (error) {
            setError('Nie udało się rozpocząć logowania.');
            setPending(false);
        } // przy sukcesie przeglądarka przechodzi do GitHuba
    }

    return (
        <>
            <button type="button" onClick={onClick} disabled={pending}>
                {pending ? 'Przekierowanie…' : label}
            </button>
            {error && <span role="alert">{error}</span>}
        </>
    );
}