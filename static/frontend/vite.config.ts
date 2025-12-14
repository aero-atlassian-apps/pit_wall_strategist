import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isForge = process.env.VITE_PLATFORM === 'atlassian'

export default defineConfig({
  base: isForge ? './' : '/',
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  resolve: {
    alias: isForge ? {} : { '@forge/bridge': '/src/shims/forge-bridge.ts' }
  }
})
