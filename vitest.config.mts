import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        projects: [
            {
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/services/**/*.test.ts', 'src/middlewares/**/*.test.ts'],
                },
            },
            {
                test: {
                    name: 'e2e',
                    environment: 'node',
                    include: ['src/controllers/**/*.test.ts'],
                },
            },
        ],
    },
});