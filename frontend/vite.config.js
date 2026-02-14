import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // 💡 NEW/CORRECTED RESOLVE BLOCK
  resolve: {
    alias: {
      // These polyfills are essential for libraries built on pdfkit/Node modules
      'stream': 'stream-browserify',
      'zlib': 'browserify-zlib',
      'buffer': 'buffer',
    },
  },
  optimizeDeps: {
    include: ['react-is', 'pako'],
    esbuildOptions: {
      supported: {
        'top-level-await': true
      }
    }
  }
})


