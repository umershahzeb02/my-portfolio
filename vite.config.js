import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base matches the GitHub Pages sub-path — without it every asset URL resolves
// against the domain root and the deployed page loads nothing.
export default defineConfig({
  base: '/my-portfolio/',
  plugins: [react(), tailwindcss()],
})
