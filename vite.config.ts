import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    cors: true,
    strictPort: false,
    hmr: {
      port: 5174
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    allowedHosts: ["doiquanai.vn"],
  },
  appType: 'spa', // Thêm dòng này để xử lý SPA routing
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom']
  },
  define: {
    global: 'globalThis'
  }
});