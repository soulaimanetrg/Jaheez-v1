import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  // Trigger server reload to pick up new .env variables
  // The desktop workspace may use a dependency junction from an older checkout.
  // Anchor HTML emission to the active project instead of Vite's realpath.
  root: process.cwd(),
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
  // lucide-react 0.460+ config removed

  server: {
    port: 3000,
    host: true,
    allowedHosts: 'all',
    hmr: {
      path: '/__admin_hmr',
    },
    proxy: {
      '/admin-api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
