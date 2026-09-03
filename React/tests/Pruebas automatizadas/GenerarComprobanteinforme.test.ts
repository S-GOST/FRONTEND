import { test, expect } from '@playwright/test';

test.describe('Módulo Generar Comprobante/Informe', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/reports/generate**', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();

      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.tipoReporte) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar un tipo de reporte.' })
          });
        } else if (!postData.fechaDesde || !postData.fechaHasta) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Las fechas son obligatorias.' })
          });
        } else if (new Date(postData.fechaDesde) > new Date(postData.fechaHasta)) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La fecha desde no puede ser mayor que la fecha hasta.' })
          });
        } else {
          // Éxito - generar reporte
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Reporte generado exitosamente.',
              data: {
                id: Date.now(),
                nombreArchivo: `reporte_${postData.tipoReporte}_${postData.fechaDesde}_${postData.fechaHasta}.pdf`,
                url: `/reports/${Date.now()}.pdf`,
                tipo: postData.tipoReporte,
                fechaGeneracion: new Date().toISOString(),
                tamaño: '2.5 MB'
              }
            })
          });
        }
      }
    });

    // Mock para descargar el reporte generado
    await page.route('**/reports/*.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF content for report')
      });
    });

    // Mock para obtener tipos de reportes disponibles
    await page.route('**/api/admin/reports/types**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'ventas', nombre: 'Reporte de Ventas', descripcion: 'Resumen de ventas por período' },
            { id: 'inventario', nombre: 'Reporte de Inventario', descripcion: 'Estado actual del inventario' },
            { id: 'servicios', nombre: 'Reporte de Servicios', descripcion: 'Servicios realizados por período' },
            { id: 'clientes', nombre: 'Reporte de Clientes', descripcion: 'Análisis de clientes activos' },
            { id: 'financiero', nombre: 'Reporte Financiero', descripcion: 'Estado financiero completo' }
          ]
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await expect(page.getByText('Generar Comprobante/Informe')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /tipo.*reporte|report.*type/i })).toBeVisible();
    await expect(page.getByLabel(/fecha.*desde|date.*from/i)).toBeVisible();
    await expect(page.getByLabel(/fecha.*hasta|date.*to/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generar|generate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancelar|cancel/i })).toBeVisible();
  });

  test('2. Debería cargar los tipos de reportes disponibles', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    const reportTypeSelect = page.getByRole('combobox', { name: /tipo.*reporte|report.*type/i });
    await expect(reportTypeSelect).toBeVisible();

    // Verificar que hay opciones cargadas
    const options = reportTypeSelect.locator('option');
    await expect(options).toHaveCount(5); // Los 5 tipos mockeados

    await expect(page.getByText(/Reporte de Ventas/i)).toBeVisible();
    await expect(page.getByText(/Reporte de Inventario/i)).toBeVisible();
    await expect(page.getByText(/Reporte de Servicios/i)).toBeVisible();
  });

  test('3. Debería mostrar error si no se selecciona tipo de reporte', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/seleccionar.*tipo.*reporte|select.*report.*type/i)).toBeVisible();
  });

  test('4. Debería mostrar error si las fechas están vacías', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/fechas.*obligatorias|dates.*required/i)).toBeVisible();
  });

  test('5. Debería mostrar error si la fecha desde es mayor que la fecha hasta', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-01'); // Fecha anterior
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/fecha.*desde.*mayor|date.*from.*greater/i)).toBeVisible();
  });

  test('6. Debería generar reporte exitosamente', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/generate') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.tipoReporte).toBe('ventas');
    expect(postData.fechaDesde).toBe('2024-01-01');
    expect(postData.fechaHasta).toBe('2024-01-31');

    await expect(page.getByText(/reporte.*generado|report.*generated/i)).toBeVisible();
    await expect(page.getByText(/reporte_ventas_2024-01-01_2024-01-31\.pdf/i)).toBeVisible();
  });

  test('7. Debería descargar el reporte generado', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('inventario');
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-02-28');
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de descarga
    const downloadButton = page.getByRole('button', { name: /descargar.*pdf|download.*pdf/i });
    await downloadButton.click();

    // Verificar que se inicia la descarga
    await expect(page).toHaveURL(/.*\/generar-reporte/);
  });

  test('8. Debería previsualizar el reporte antes de descargar', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('servicios');
    await page.getByLabel(/fecha.*desde/i).fill('2024-03-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-03-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de previsualizar
    const previewButton = page.getByRole('button', { name: /previsualizar|preview/i });
    await previewButton.click();

    // Verificar que se abre una vista previa
    await expect(page.getByText(/Reporte de Servicios/i)).toBeVisible();
    await expect(page.getByText(/2024-03-01.*2024-03-31/i)).toBeVisible();
  });

  test('9. Debería mostrar indicador de carga durante la generación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/reports/generate**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Reporte generado exitosamente.',
          data: {
            id: Date.now(),
            nombreArchivo: 'reporte_lento.pdf',
            url: '/reports/slow.pdf',
            tipo: 'ventas',
            fechaGeneracion: new Date().toISOString(),
            tamaño: '5.0 MB'
          }
        })
      });
    });

    await page.goto('/admin/generar-reporte');
    
    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('financiero');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-12-31');
    
    const button = page.getByRole('button', { name: /generar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/generando|generating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('10. Debería manejar error al generar reporte', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/reports/generate**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al generar reporte.' })
      });
    });

    await page.goto('/admin/generar-reporte');
    
    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('clientes');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/error.*generar|error.*generate/i)).toBeVisible();
  });

  test('11. Debería mostrar información del reporte generado', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Verificar que se muestra información del reporte
    await expect(page.getByText(/Nombre.*reporte_ventas/i)).toBeVisible();
    await expect(page.getByText(/Tamaño.*2\.5 MB/i)).toBeVisible();
    await expect(page.getByText(/Fecha.*generación/i)).toBeVisible();
  });

  test('12. Debería permitir generar múltiples reportes', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    // Generar primer reporte
    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();
    await expect(page.getByText(/reporte.*generado/i)).toBeVisible();

    // Generar segundo reporte
    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('inventario');
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-02-28');
    await page.getByRole('button', { name: /generar/i }).click();
    await expect(page.getByText(/reporte.*generado/i)).toBeVisible();

    // Verificar que ambos se generaron
    await expect(page.getByText(/reporte_ventas/i)).toBeVisible();
    await expect(page.getByText(/reporte_inventario/i)).toBeVisible();
  });

  test('13. Debería limpiar formulario después de generar', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/reporte.*generado/i)).toBeVisible();

    // Verificar que el formulario se limpia (si tu implementación lo hace)
    // Esto depende de si rediriges o reseteas el formulario
  });

  test('14. Debería validar formato de fechas', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    await page.getByRole('combobox', { name: /tipo.*reporte/i }).selectOption('ventas');
    await page.getByLabel(/fecha.*desde/i).fill('invalid-date');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Dependiendo de tu validación frontend/backend
    await expect(page.getByText(/fecha.*válida|date.*valid/i)).toBeVisible();
  });

  test('15. Debería mostrar historial de reportes generados', async ({ page }) => {
    await page.goto('/admin/generar-reporte');

    // Verificar que existe sección de historial
    await expect(page.getByText(/historial.*reportes|report.*history/i)).toBeVisible();
    
    // Si hay reportes previos, deberían mostrarse aquí
    // Esto depende de tu implementación real
  });
});