import { getCurrentSession } from '@/lib/session';
import AuthControls from './AuthControls';

type Loaded = { ok: true; name: string | null } | { ok: false };

async function loadUser(): Promise<Loaded> {
    try {
        const session = await getCurrentSession();
        return { ok: true, name: session ? session.user.name : null };
    } catch (error) {
        // Awaria bazy nie może wywrócić całego układu
        console.error('Nie udało się odczytać sesji:', error);
        return { ok: false };
    }
}

export default async function UserMenu() {
    const result = await loadUser();

    if (!result.ok) {
        return <span role="status">Stan logowania chwilowo niedostępny</span>;
    }
    return <AuthControls user={result.name !== null ? { name: result.name } : null} />;
}