import { defineConfig } from 'tsup'
import path from 'node:path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  external: ['@prisma/client', '.prisma'], // Don't bundle Prisma
  platform: 'node',
  target: 'node18',
  splitting: false,
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    }
  },
})
