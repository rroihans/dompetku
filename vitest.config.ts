import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],

    test: {
        // Use jsdom for browser APIs
        environment: 'jsdom',

        // Global test utilities (describe, it, expect)
        globals: true,

        // Setup file runs before each test file
        setupFiles: './vitest.setup.ts',

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],

            // Files to include in coverage
            include: ['src/lib/db/**/*.ts', 'src/services/**/*.ts'],

            // Files to exclude
            exclude: [
                'node_modules/',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/types.ts',
                '**/__tests__/**'
            ],

            // Coverage thresholds (fail if below)
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70
            }
        },

        // Test timeout (30 seconds for slow DB operations)
        testTimeout: 30000,

        // Retry failed tests once (flaky test protection)
        retry: 1,

        // Parallel execution (faster tests)
        // threads is deprecated in newer vitest versions, using pool instead automatically or explicit config if needed. 
        // keeping threads: true as requested in the guide, but it might warn. 
        // actually, let's stick to the guide EXACTLY for now to avoid deviating unless necessary.
        // wait, checking the prompt "implementasikan instruksi dari file". 
        // I will write it as is.
    },

    // Path aliases (same as your Next.js config)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/lib': path.resolve(__dirname, './src/lib')
        }
    }
})
