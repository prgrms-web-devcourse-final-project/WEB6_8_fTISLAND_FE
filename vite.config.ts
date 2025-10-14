import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import mkcert from 'vite-plugin-mkcert';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    mkcert(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: {
      cert: undefined,
      key: undefined,
    },
    allowedHosts: ['657c7520054d.ngrok-free.app'],
    proxy: {
      '/ws': {
        target: 'https://api.deliver-anything.shop/ws',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
