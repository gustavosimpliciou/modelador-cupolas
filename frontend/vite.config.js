import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Accept any host (needed for the *.preview.emergentagent.com proxy)
    allowedHosts: true,
  },
  build: {
    // Larger chunks are fine — this app has heavy 3D deps (three.js, drei)
    chunkSizeWarningLimit: 2000,
    // Disable minification-heavy transforms that slow down first build
    target: 'es2020',
  },
})
