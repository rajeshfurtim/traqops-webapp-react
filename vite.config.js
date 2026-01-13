import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Use mkcert certificates if available, otherwise Vite will auto-generate
let httpsConfig = true

const certPath = path.resolve(__dirname, '_wildcard.local.site+2.pem')
const keyPath = path.resolve(__dirname, '_wildcard.local.site+2-key.pem')

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  httpsConfig = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4200,
    strictPort: true,
    https: httpsConfig,
    open: false,
    cors: true,
    allowedHosts: [
      '.local.site',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      protocol: 'wss'
    },
    proxy: {
      '/unsecure': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/secure': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('TraqOps')
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2']
  }
})