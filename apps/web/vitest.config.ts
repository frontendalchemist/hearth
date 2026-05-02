import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{src,test-utils}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
