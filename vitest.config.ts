/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        'astro.config.mjs',
        'vitest.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    }
  },
  esbuild: {
    target: 'es2020',
    format: 'esm',
    supported: {
      'object-rest-spread': true,
      'destructuring': true
    }
  }
})