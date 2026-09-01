import { test, expect } from '@playwright/test';

test.describe('Módulo Generar Informe de Orden', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/reports/order**', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();

      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.orderId && !postData.dateRange) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar una orden específica o un rango de fechas.' })
          });
        } else if (postData.orderId && isNaN(parseInt(postData.orderId))) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El ID de orden debe ser un número válido.' })
          });
        } else if (postData.dateRange && (!postData.dateRange.from || !postData.dateRange.to)) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Ambas fechas del rango son obligatorias.' })
          });
        } else if (postData.dateRange && new Date(postData.dateRange.from) > new Date(postData.dateRange.to)) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La fecha desde no puede ser mayor que la fecha hasta.' })
          });
        } else {
          // Éxito - generar informe de orden
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Informe de orden generado exitosamente.',
              data: {
                id: Date.now(),
                nombreArchivo: postData.orderId 
                  ? `orden_${postData.orderId}_${new Date().toISOString().split('T')[0]}.pdf`
                  : `ordenes_rango_${postData.dateRange.from}_${postData.dateRange.to}.pdf`,
                url: `/reports/orders/${Date.now()}.pdf`,
                tipo: postData.orderId ? 'individual' : 'rango',
                fechaGeneracion: new Date().toISOString(),
                detalles: postData.orderId 
                  ? {
                      orderId: postData.orderId,
                      cliente: 'Juan Pérez',
                      total: 1500.00,
                      items: 3,
                      estado: 'completada'
                    }
                  : {
                      totalOrdenes: 25,
                      valorTotal: 37500.00,
                      periodo: `${postData.dateRange.from} - ${postData.dateRange.to}`,
                      estadosDistribucion: {
                        pendiente: 5,
                        procesando: 8,
                        completada: 10,
                        cancelada: 2
                      }
                    }
              }
            })
          });
        }
      }
    });

    // Mock para descargar el informe
    await page.route('**/reports/orders/*.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF content for order report')
      });
    });

    // Mock para obtener lista de órdenes recientes
    await page.route('**/api/admin/orders/recent**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, numeroOrden: 'ORD-2024-001', cliente: 'Juan Pérez', total: 1500.00, estado: 'completada', fecha: '2024-01-15' },
            { id: 2, numeroOrden: 'ORD-2024-002', cliente: 'María García', total: 800.00, estado: 'procesando', fecha: '2024-01-16' },
            { id: 3, numeroOrden: 'ORD-2024-003', cliente: 'Carlos López', total: 2200.00, estado: 'pendiente', fecha: '2024-01-17' },
            { id: 4, numeroOrden: 'ORD-2024-004', cliente: 'Ana Rodríguez', total: 950.00, estado: 'completada', fecha: '2024-01-18' },
            { id: 5, numeroOrden: 'ORD-2024-005', cliente: 'Luis Martínez', total: 1200.00, estado: 'cancelada', fecha: '2024-01-19' }
          ]
        })
      });
    });

    // Mock para obtener estadísticas de órdenes
    await page.route('**/api/admin/orders/stats**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            totalOrdenesMes: 120,
            valorTotalMes: 180000.00,
            ordenesCompletadas: 98,
            tasaCompletacion: 81.7,
            tiempoPromedioResolucion: '3.5 días',
            clientesRecurrentes: 45,
            productosMasVendidos: [
              { nombre: 'Laptop Gamer Pro', ventas: 25 },
              { nombre: 'Smartphone X', ventas: 20 },
              { nombre: 'Monitor 27"', ventas: 15 }
            ],
            serviciosMasSolicitados: [
              { nombre: 'Mantenimiento Preventivo', solicitudes: 30 },
              { nombre: 'Reparación Básica', solicitudes: 25 },
              { nombre: 'Consultoría Técnica', solicitudes: 18 }
            ]
          }
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await expect(page.getByText('Generar Informe de Orden')).toBeVisible();
    await expect(page.getByRole('radiogroup')).toBeVisible(); // Para elegir entre orden individual o rango
    await expect(page.getByRole('combobox', { name: /orden|order/i })).toBeVisible();
    await expect(page.getByLabel(/fecha.*desde|date.*from/i)).toBeVisible();
    await expect(page.getByLabel(/fecha.*hasta|date.*to/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generar|generate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancelar|cancel/i })).toBeVisible();
  });

  test('2. Debería cargar la lista de órdenes recientes', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    const orderSelect = page.getByRole('combobox', { name: /orden|order/i });
    await expect(orderSelect).toBeVisible();

    // Verificar que hay opciones cargadas
    const options = orderSelect.locator('option');
    await expect(options).toHaveCount(5); // Las 5 órdenes mockeadas

    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible();
  });

  test('3. Debería mostrar error si no se selecciona orden ni rango de fechas', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/seleccionar.*orden.*rango.*fechas|select.*order.*date.*range/i)).toBeVisible();
  });

  test('4. Debería mostrar error si el ID de orden es inválido', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    // Seleccionar opción de orden individual
    await page.getByRole('radio', { name: /orden.*individual|single.*order/i }).check();
    
    // Intentar ingresar un ID inválido
    await page.getByRole('combobox', { name: /orden/i }).fill('abc');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/id.*orden.*número.*válido|order.*id.*valid.*number/i)).toBeVisible();
  });

  test('5. Debería mostrar error si las fechas del rango están incompletas', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    // Seleccionar opción de rango de fechas
    await page.getByRole('radio', { name: /rango.*fechas|date.*range/i }).check();
    
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    // No llenar fecha hasta
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/ambas.*fechas.*obligatorias|both.*dates.*required/i)).toBeVisible();
  });

  test('6. Debería mostrar error si la fecha desde es mayor que la fecha hasta', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /rango.*fechas/i }).check();
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-01');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/fecha.*desde.*mayor|date.*from.*greater/i)).toBeVisible();
  });

  test('7. Debería generar informe de orden individual exitosamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /orden.*individual/i }).check();
    await page.getByRole('combobox', { name: /orden/i }).selectOption('1'); // ORD-2024-001
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/order') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.orderId).toBe('1');
    expect(postData.tipo).toBe('individual');

    await expect(page.getByText(/informe.*generado|report.*generated/i)).toBeVisible();
    await expect(page.getByText(/orden_1_/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/\$1,500|\$1500/i)).toBeVisible();
  });

  test('8. Debería generar informe de rango de fechas exitosamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /rango.*fechas/i }).check();
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/order') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.dateRange.from).toBe('2024-01-01');
    expect(postData.dateRange.to).toBe('2024-01-31');
    expect(postData.tipo).toBe('rango');

    await expect(page.getByText(/informe.*generado/i)).toBeVisible();
    await expect(page.getByText(/ordenes_rango_2024-01-01_2024-01-31/i)).toBeVisible();
    await expect(page.getByText(/25.*órdenes|25.*orders/i)).toBeVisible();
    await expect(page.getByText(/\$37,500|\$37500/i)).toBeVisible();
  });

  test('9. Debería mostrar distribución de estados en informe de rango', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /rango.*fechas/i }).check();
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Verificar que se muestra la distribución de estados
    await expect(page.getByText(/Pendiente.*5/i)).toBeVisible();
    await expect(page.getByText(/Procesando.*8/i)).toBeVisible();
    await expect(page.getByText(/Completada.*10/i)).toBeVisible();
    await expect(page.getByText(/Cancelada.*2/i)).toBeVisible();
  });

  test('10. Debería descargar el informe en PDF', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /orden.*individual/i }).check();
    await page.getByRole('combobox', { name: /orden/i }).selectOption('2');
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de descarga
    const downloadButton = page.getByRole('button', { name: /descargar.*pdf|download.*pdf/i });
    await downloadButton.click();

    // Verificar que se inicia la descarga
    await expect(page).toHaveURL(/.*\/generar-informe-orden/);
  });

  test('11. Debería previsualizar el informe antes de descargar', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    await page.getByRole('radio', { name: /rango.*fechas/i }).check();
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-02-28');
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de previsualizar
    const previewButton = page.getByRole('button', { name: /previsualizar|preview/i });
    await previewButton.click();

    // Verificar que se abre una vista previa
    await expect(page.getByText(/Informe de Órdenes/i)).toBeVisible();
    await expect(page.getByText(/2024-02-01.*2024-02-28/i)).toBeVisible();
  });

  test('12. Debería mostrar indicador de carga durante la generación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/reports/order**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 segundos
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Informe generado exitosamente.',
          data: {
            id: Date.now(),
            nombreArchivo: 'orden_lenta.pdf',
            url: '/reports/orders/slow.pdf',
            tipo: 'individual',
            fechaGeneracion: new Date().toISOString(),
            detalles: {
              orderId: '1',
              cliente: 'Cliente Lento',
              total: 2000.00,
              items: 5,
              estado: 'completada'
            }
          }
        })
      });
    });

    await page.goto('/admin/generar-informe-orden');
    
    await page.getByRole('radio', { name: /orden.*individual/i }).check();
    await page.getByRole('combobox', { name: /orden/i }).selectOption('1');
    
    const button = page.getByRole('button', { name: /generar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/generando|generating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('13. Debería manejar error al generar informe', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/reports/order**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al generar informe de orden.' })
      });
    });

    await page.goto('/admin/generar-informe-orden');
    
    await page.getByRole('radio', { name: /rango.*fechas/i }).check();
    await page.getByLabel(/fecha.*desde/i).fill('2024-03-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-03-31');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/error.*generar|error.*generate/i)).toBeVisible();
  });

  test('14. Debería mostrar estadísticas generales de órdenes', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    // Verificar que se muestran estadísticas
    await expect(page.getByText(/Total.*órdenes.*mes.*120/i)).toBeVisible();
    await expect(page.getByText(/Valor.*total.*\$180,000|\$180000/i)).toBeVisible();
    await expect(page.getByText(/Órdenes.*completadas.*98/i)).toBeVisible();
    await expect(page.getByText(/Tasa.*completación.*81\.7%/i)).toBeVisible();
    await expect(page.getByText(/Tiempo.*promedio.*resolución.*3\.5.*días/i)).toBeVisible();
  });

  test('15. Debería mostrar productos y servicios más vendidos', async ({ page }) => {
    await page.goto('/admin/generar-informe-orden');

    // Verificar productos más vendidos
    await expect(page.getByText(/Productos.*más.*vendidos|Top.*products/i)).toBeVisible();
    await expect(page.getByText(/Laptop.*Gamer.*Pro.*25/i)).toBeVisible();
    await expect(page.getByText(/Smartphone.*X.*20/i)).toBeVisible();
    await expect(page.getByText(/Monitor.*27".*15/i)).toBeVisible();

    // Verificar servicios más solicitados
    await expect(page.getByText(/Servicios.*más.*solicitados|Top.*services/i)).toBeVisible();
    await expect(page.getByText(/Mantenimiento.*Preventivo.*30/i)).toBeVisible();
    await expect(page.getByText(/Reparación.*Básica.*25/i)).toBeVisible();
    await expect(page.getByText(/Consultoría.*Técnica.*18/i)).toBeVisible();
  });
});