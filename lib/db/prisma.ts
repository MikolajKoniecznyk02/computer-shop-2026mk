import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
    if (!globalForPrisma.__prisma) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
        globalForPrisma.__prisma = new PrismaClient({
            adapter: new PrismaPg({ connectionString }),
        });
    }
    return globalForPrisma.__prisma;
}