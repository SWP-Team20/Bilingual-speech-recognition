import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')

  const isHttps = env.VITE_HTTPS === 'true'
  const backendUrl = env.VITE_API_URL || 'https://192.168.56.1:8000'

  return {
    plugins: [react()],
    envDir: '../',
    server: {
      https: isHttps ? {
        key: fs.readFileSync('../key.pem'),
        cert: fs.readFileSync('../cert.pem'),
      } : false,
      port: 5173,
      proxy: {
        '/audio': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    }
  }
})
