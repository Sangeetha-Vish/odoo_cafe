import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared-auth': fileURLToPath(new URL('../shared/auth/frontend', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: process.env.BROWSER_OPEN === 'true',
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5002',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
