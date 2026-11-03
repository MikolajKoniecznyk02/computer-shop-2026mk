import { getCurrentSession } from '@/lib/session';
import AuthControls from './AuthControls';

export default async function UserMenu() {
    try {
        const session = await getCurrentSession();
        return <AuthControls user={session ? { name: session.user.name } : null} />;
    } catch (error) {
        // Awaria bazy nie może wywrócić całego układu (błąd layoutu nie trafia do error.tsx tego segmentu).
        console.error('Nie udało się odczytać sesji:', error);
        return <span role="status">Stan logowania chwilowo niedostępny</span>;
    }
}