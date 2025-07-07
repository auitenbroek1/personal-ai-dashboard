import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Skip TypeScript checking during build
    target: 'es2020'
  },
  build: {
    // Optimize for production
    target: 'es2020',
    rollupOptions: {
      onwarn(warning, warn) {
        // Skip TypeScript warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      }
    }
  }
})
