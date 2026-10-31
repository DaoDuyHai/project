import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'controllers/**/*.js',
        'services/**/*.js',
        'utils/**/*.js',
        'middlewares/**/*.js',
        'sockets/**/*.js',
      ],
      exclude: ['tests/**', 'node_modules/**', 'seed.js'],
    },
  },
});
