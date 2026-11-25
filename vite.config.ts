import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Static single-page app: routing is hash-based, so the build works from any
// path (user.github.io/repo/) without server rewrites. `base: './'` keeps every
// asset and the engine's wasm reachable at that arbitrary path.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: false },
  build: { target: 'es2022' },
})
