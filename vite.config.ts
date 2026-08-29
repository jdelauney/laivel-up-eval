import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // GitHub Pages sert le site sous /laivel-up-eval/ et les previews de PR sous
  // un sous-dossier supplementaire. Une base relative marche dans les deux cas,
  // la contrepartie est qu'elle ne convient plus si un routeur client sert des
  // routes imbriquees.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['__tests__/{unit,integration}/**/*.test.{ts,tsx}'],
    exclude: ['__tests__/e2e/**'],
  },
})