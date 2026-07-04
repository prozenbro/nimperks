import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/rpc-mainnet': {
        target: 'https://rpc-mainnet.nimiqscan.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc-mainnet/, '')
      },
      '/rpc-testnet': {
        target: 'https://rpc-testnet.nimiqscan.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc-testnet/, '')
      }
    }
  }
});
