import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
    },
  },
})
