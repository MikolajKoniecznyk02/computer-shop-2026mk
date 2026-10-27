import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
    esbuild: { jsx: 'automatic' },
    resolve: {
        alias: {
            '@': root,
            'server-only': path.join(root, 'tests', 'server-only-stub.ts'),
        },
    },
    test: {
        environment: 'node',
        globalSetup: ['./tests/global-setup.ts'],
        setupFiles: ['./tests/setup.ts'],
        fileParallelism: false, // testy dzielą jedną bazę testową
        hookTimeout: 30_000,
        testTimeout: 30_000,
    },
});