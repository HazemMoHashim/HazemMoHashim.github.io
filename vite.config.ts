import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User site (HazemMoHashim.github.io) is served from the repo root,
// so base stays '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5173, strictPort: true },
})
