import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repositoryName =
  'Sales-Agent-for-Agora-Hackathon-Philippines-2026-Build-Next-Gen-AI-Sales-Agent';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES ? `/${repositoryName}/` : '/',
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
