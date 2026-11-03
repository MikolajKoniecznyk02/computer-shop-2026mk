'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { authClient } from '@/lib/auth-client';
import SignInButton from './SignInButton';

export default function AuthControls({ user }: { user: { name: string } | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    if (!user) return <SignInButton label="Zaloguj" />;

    return (
        <div className="auth-controls">
            <span>
                Zalogowano: <strong>{user.name}</strong>
            </span>
            <button
                type="button"
                disabled={pending}
                onClick={() =>
                    startTransition(async () => {
                        await authClient.signOut();
                        router.push('/');
                        router.refresh(); // nawigacja i widoki znów zgodne z sesją serwera
                    })
                }
            >
                {pending ? 'Wylogowywanie…' : 'Wyloguj'}
            </button>
        </div>
    );
}