import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const backendUrl = (env.VITE_API_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
  const proxy = {
    '/api': { target: backendUrl, changeOrigin: true },
  }

  return {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(backendUrl),
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: { proxy },
  }
})
