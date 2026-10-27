import 'dotenv/config';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('Brak TEST_DATABASE_URL w .env');
process.env.DATABASE_URL = testUrl; // repozytorium w testach używa bazy testowej