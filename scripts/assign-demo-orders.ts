import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

async function main() {
    const email = process.argv[2];
    if (!email) throw new Error('Użycie: npm run db:assign-demo-orders -- twoj@email');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Brak zmiennej DATABASE_URL');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error(`Nie ma użytkownika z adresem ${email}. Najpierw zaloguj się przez GitHub.`);
        if (user.id === 'user_demo_1') throw new Error('Wskaż prawdziwego użytkownika, nie konto demo.');
        const r = await prisma.order.updateMany({ where: { userId: 'user_demo_1' }, data: { userId: user.id } });
        console.log(`Przypisano ${r.count} zamówień demo do ${email}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
});