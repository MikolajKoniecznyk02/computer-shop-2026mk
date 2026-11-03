import type { BetterAuthOptions } from 'better-auth';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Brak zmiennej środowiskowej ${name}`);
    return value;
}

/** Wspólne ustawienia dla aplikacji i CLI. Brak zmiennej = błąd przy konfiguracji (bez rzutowania typu). */
export function createAuthOptions() {
    const secret = requireEnv('BETTER_AUTH_SECRET');
    if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET musi mieć co najmniej 32 znaki');

    return {
        appName: 'Sklep komputerowy 2026',
        baseURL: requireEnv('BETTER_AUTH_URL'),
        secret,
        socialProviders: {
            github: {
                clientId: requireEnv('GITHUB_CLIENT_ID'),
                clientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
                scope: ['user:email'], // adres e-mail; bez uprawnień do repozytoriów
            },
        },
        // podstawa: bez cache sesji, żeby unieważnienie w bazie działało od razu
        session: { cookieCache: { enabled: false } },
        // NIE ustawiamy disableCSRFCheck ani disableOriginCheck
    } satisfies BetterAuthOptions;
}