import 'dotenv/config';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('Brak TEST_DATABASE_URL w .env');
process.env.DATABASE_URL = testUrl; // repozytorium w testach używa bazy testowej

// Konfiguracja auth sprawdza obecność zmiennych; w testach wystarczą wartości zastępcze.
process.env.BETTER_AUTH_SECRET ??= 'test-secret-test-secret-test-secret-123456';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
process.env.GITHUB_CLIENT_ID ??= 'test-client-id';
process.env.GITHUB_CLIENT_SECRET ??= 'test-client-secret';