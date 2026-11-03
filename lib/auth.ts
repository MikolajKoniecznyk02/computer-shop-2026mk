import 'server-only';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { getPrisma } from '@/lib/db/prisma';
import { createAuthOptions } from './auth-options';

export const auth = betterAuth({
    ...createAuthOptions(),
    database: prismaAdapter(getPrisma(), { provider: 'postgresql' }),
    plugins: [nextCookies()], // musi być ostatnią wtyczką; ustawia cookies z poziomu Server Actions
});