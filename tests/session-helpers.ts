import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@/lib/generated/prisma/client';

/** Podpisany cookie sesji w formacie Better Auth: wartość.podpis (HMAC-SHA256 z BETTER_AUTH_SECRET). */
export function sessionCookie(token: string): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('Brak BETTER_AUTH_SECRET');
    const signature = createHmac('sha256', secret).update(token).digest('base64');
    return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

export async function createSession(prisma: PrismaClient, userId: string, expiresAt?: Date) {
    const token = randomBytes(24).toString('hex');
    await prisma.session.create({
        data: { id: randomUUID(), token, userId, expiresAt: expiresAt ?? new Date(Date.now() + 3_600_000) },
    });
    return { token, headers: new Headers({ cookie: sessionCookie(token) }) };
}