import { defineConfig, devices } from '@playwright/test';

/**
 * Leer variables de entorno desde el archivo.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Ver https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/Pruebas automatizadas',
  /* Ejecutar pruebas en archivos en paralelo */
  fullyParallel: true,
  /* Fallar la build en CI si accidentalmente dejaste test.only en el código fuente. */
  forbidOnly: !!process.env.CI,
  /* Reintentar solo en CI */
  retries: process.env.CI ? 2 : 0,
  /* Optar por no usar pruebas en paralelo en CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reportero a utilizar. Ver https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configuraciones compartidas para todos los proyectos a continuación. Ver https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* URL base a usar en acciones como `await page.goto('')`. */

    baseURL: 'http://localhost:5173',
    /* Recolectar traza al reintentar la prueba fallida. Ver https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configurar proyectos para los principales navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Pruebas en viewports de dispositivos móviles. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Pruebas en navegadores de marca. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Ejecutar tu servidor de desarrollo local antes de iniciar las pruebas */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
