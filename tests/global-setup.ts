import 'dotenv/config';
import { execSync } from 'node:child_process';

export default function setup() {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) throw new Error('Brak TEST_DATABASE_URL w .env');
    execSync('npx --no-install prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: url },
    });
}