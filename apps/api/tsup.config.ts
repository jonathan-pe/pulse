import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/@pulse\/.*/], // Bundle all workspace packages
  external: ['@prisma/client', '.prisma'], // Don't bundle Prisma
  platform: 'node',
  target: 'node18',
  splitting: false,
  bundle: true,
})
