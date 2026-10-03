import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // tanpa impor modul node, agar tidak perlu @types/node hanya untuk alias
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    // demo di-deploy ke Vercel sebagai SPA statis
    outDir: 'dist',
    sourcemap: false,
  },
})
