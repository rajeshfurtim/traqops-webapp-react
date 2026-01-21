import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const enableHttps = env.VITE_ENABLE_HTTPS === 'true'

  let httpsConfig = false

  if (enableHttps) {
    const certPath = path.resolve(__dirname, '_wildcard.local.site+2.pem')
    const keyPath = path.resolve(__dirname, '_wildcard.local.site+2-key.pem')

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      httpsConfig = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      }
    } else {
      httpsConfig = true
    }
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 4200,
      strictPort: true,
      https: httpsConfig,

      allowedHosts: [
        '.local.site',
        'localhost',
        '127.0.0.1',
      ],

      hmr: {
        protocol: enableHttps ? 'wss' : 'ws',
      },

      proxy: {
        '/unsecure': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/secure': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },

    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify('TraqOps'),
    },
  }
})