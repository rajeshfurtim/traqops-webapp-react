import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    open: true
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('TraqOps')
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2']
  }
})