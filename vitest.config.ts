import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './src/setupTests.ts',
        css: {
            modules: {
                classNameStrategy: 'non-scoped'
            }
        },
        server: {
            deps: {
                inline: [/@csstools/, /@asamuzakjp/, /react-pdf/]
            }
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/setupTests.ts',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'dist/',
                'example/'
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
