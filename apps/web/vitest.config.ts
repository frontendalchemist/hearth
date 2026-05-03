import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // Use the modern automatic JSX runtime so test files don't need to import
  // React themselves. Matches the app's tsconfig (`"jsx": "preserve"` + Next's
  // jsx-runtime), and avoids pulling in @vitejs/plugin-react just for tests.
  esbuild: { jsx: 'automatic' },
  test: {
    // Default to node — most tests are server/auth/library code. Component
    // tests opt into happy-dom via `// @vitest-environment happy-dom` at the
    // top of the file (see src/components/shared/page-header.test.tsx).
    environment: 'node',
    include: ['{src,test-utils}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts', '**/e2e/**'],
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
