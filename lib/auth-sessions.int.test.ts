import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { createTestClient, createUser, make, resetAll } from '@/tests/helpers';
import { createSession } from '@/tests/session-helpers';

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
    await createUser(prisma, 'user_b');
});

const valid = async (headers: Headers) => (await auth.api.getSession({ headers }))?.user.id ?? null;

describe('sesje na wielu urządzeniach', () => {
    it('signOut unieważnia tylko bieżącą sesję', async () => {
        const laptop = await createSession(prisma, 'user_a');
        const phone = await createSession(prisma, 'user_a');
        await auth.api.signOut({ headers: laptop.headers });
        expect(await valid(laptop.headers)).toBeNull();
        expect(await valid(phone.headers)).toBe('user_a');
    });

    it('revokeOtherSessions zostawia tylko bieżącą', async () => {
        const laptop = await createSession(prisma, 'user_a');
        const phone = await createSession(prisma, 'user_a');
        await auth.api.revokeOtherSessions({ headers: laptop.headers });
        expect(await valid(laptop.headers)).toBe('user_a');
        expect(await valid(phone.headers)).toBeNull();
    });

    it('revokeSessions unieważnia wszystkie sesje użytkownika, ale nie cudze', async () => {
        const laptop = await createSession(prisma, 'user_a');
        const phone = await createSession(prisma, 'user_a');
        const other = await createSession(prisma, 'user_b');
        await auth.api.revokeSessions({ headers: laptop.headers });
        expect(await valid(laptop.headers)).toBeNull();
        expect(await valid(phone.headers)).toBeNull();
        expect(await valid(other.headers)).toBe('user_b');
        expect(await prisma.session.count({ where: { userId: 'user_a' } })).toBe(0);
    });
});