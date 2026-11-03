import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';
import { createSession } from '@/tests/session-helpers';

// next/headers poza żądaniem: neutralny mock (używa go wtyczka nextCookies)
vi.mock('next/headers', () => ({
    headers: async () => new Headers(),
    cookies: async () => ({ get: () => undefined, set: () => { }, delete: () => { } }),
}));

import { auth } from '@/lib/auth';

let prisma: PrismaClient;
beforeAll(() => {
    prisma = createTestClient();
});
afterAll(async () => {
    await prisma.$disconnect();
});
beforeEach(async () => {
    await resetAll(prisma, [make({ id: 1, code: 'AAAAAAAAA1' })]);
    await createUser(prisma, 'user_a');
});

describe('sesja z prawdziwą biblioteką', () => {
    it('poprawny podpisany cookie daje sesję użytkownika (test kontrolny pomocnika)', async () => {
        const { headers } = await createSession(prisma, 'user_a');
        const s = await auth.api.getSession({ headers });
        expect(s?.user.id).toBe('user_a');
    });

    it('fałszywy cookie nie daje sesji', async () => {
        const h = new Headers({ cookie: 'better-auth.session_token=fake.fake' });
        expect(await auth.api.getSession({ headers: h })).toBeNull();
    });

    it('prawdziwy token bez podpisu nie daje sesji', async () => {
        const { token } = await createSession(prisma, 'user_a');
        const h = new Headers({ cookie: `better-auth.session_token=${token}` });
        expect(await auth.api.getSession({ headers: h })).toBeNull();
    });

    it('sesja usunięta w bazie jest natychmiast nieważna (cookieCache wyłączony)', async () => {
        const { token, headers } = await createSession(prisma, 'user_a');
        expect((await auth.api.getSession({ headers }))?.user.id).toBe('user_a');
        await prisma.session.delete({ where: { token } });
        expect(await auth.api.getSession({ headers })).toBeNull();
    });

    it('sesja wygasła jest nieważna', async () => {
        const { headers } = await createSession(prisma, 'user_a', new Date(Date.now() - 1000));
        expect(await auth.api.getSession({ headers })).toBeNull();
    });
});