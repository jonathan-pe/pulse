import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: false,
  format: ['esm'],
  target: 'node18',
  sourcemap: true,
  clean: true,
  minify: false,
  outDir: 'dist',
  bundle: true,
  esbuildOptions(options) {
    options.platform = 'node'
  }
})
