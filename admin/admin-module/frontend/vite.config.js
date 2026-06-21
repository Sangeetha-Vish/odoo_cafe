import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared-auth': fileURLToPath(new URL('../../../shared/auth/frontend', import.meta.url)),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    open: process.env.BROWSER_OPEN === 'true',
  },
});
