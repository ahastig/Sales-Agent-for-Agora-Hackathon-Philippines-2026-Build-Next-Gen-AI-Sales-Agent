import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES ? './' : '/',
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
