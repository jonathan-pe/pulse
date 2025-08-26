import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // 0.0.0.0
    port: 5174,
    // HMR needs to know the host you’re using in the browser:
    hmr: { host: 'www.playpulse.test' },
  },
  preview: { host: true },
})
