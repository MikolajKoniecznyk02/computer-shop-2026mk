import 'server-only';
import { getCurrentSession } from '@/lib/session';

/** JEDYNE miejsce ustalające właściciela danych: session.user.id z bazy sesji, z nagłówków bieżącego żądania. */
export async function currentUserId(): Promise<string | null> {
    const session = await getCurrentSession();
    return session?.user.id ?? null;
}