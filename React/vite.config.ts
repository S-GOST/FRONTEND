import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
  },
  test: {
    environment: 'jsdom',               // ← Simula el navegador
    globals: true,                       // ← Permite usar describe/it/expect sin importarlos
    setupFiles: './src/setupTests.ts',   // ← Archivo que se ejecuta antes de cada prueba
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],  // ← Dónde buscar pruebas
    exclude: ['tests/**', 'node_modules/**', 'dist/**'], // ← Qué ignorar
  }
})
