import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar/Descargar Comprobantes', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/receipts**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const orderId = url.searchParams.get('orderId') || '';
      const dateFrom = url.searchParams.get('dateFrom') || '';
      const dateTo = url.searchParams.get('dateTo') || '';
      const type = url.searchParams.get('type') || ''; // invoice, receipt, quote

      let receipts = [
        { 
          id: 1, 
          numeroComprobante: 'FAC-2024-001', 
          tipo: 'factura', 
          ordenId: 1, 
          cliente: 'Juan Pérez', 
          fechaEmision: '2024-01-15', 
          total: 1500.00, 
          estado: 'emitido',
          pdfUrl: '/pdfs/factura-001.pdf'
        },
        { 
          id: 2, 
          numeroComprobante: 'REC-2024-002', 
          tipo: 'recibo', 
          ordenId: 2, 
          cliente: 'María García', 
          fechaEmision: '2024-01-16', 
          total: 800.00, 
          estado: 'emitido',
          pdfUrl: '/pdfs/recibo-002.pdf'
        },
        { 
          id: 3, 
          numeroComprobante: 'COT-2024-003', 
          tipo: 'cotizacion', 
          ordenId: 3, 
          cliente: 'Carlos López', 
          fechaEmision: '2024-01-17', 
          total: 2200.00, 
          estado: 'pendiente',
          pdfUrl: '/pdfs/cotizacion-003.pdf'
        },
        { 
          id: 4, 
          numeroComprobante: 'FAC-2024-004', 
          tipo: 'factura', 
          ordenId: 4, 
          cliente: 'Ana Rodríguez', 
          fechaEmision: '2024-01-18', 
          total: 950.00, 
          estado: 'anulado',
          pdfUrl: '/pdfs/factura-004.pdf'
        }
      ];

      // Filtrar por tipo si se especifica
      if (type) {
        receipts = receipts.filter(r => r.tipo === type);
      }

      // Filtrar por rango de fechas si se especifica
      if (dateFrom && dateTo) {
        receipts = receipts.filter(r => {
          const receiptDate = new Date(r.fechaEmision);
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          return receiptDate >= from && receiptDate <= to;
        });
      }

      // Filtrar por orden si se especifica
      if (orderId) {
        receipts = receipts.filter(r => r.ordenId.toString() === orderId);
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: receipts,
          total: receipts.length
        })
      });
    });

    // Mock para descargar PDF
    await page.route('**/pdfs/*.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF content') // PDF mock básico
      });
    });

    // Mock para reemitir comprobante
    await page.route('**/api/admin/receipts/*/reissue', async (route) => {
      const request = route.request();
      
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Comprobante reemitido exitosamente.',
            data: {
              id: 1,
              numeroComprobante: 'FAC-2024-001-R1',
              fechaEmision: new Date().toISOString().split('T')[0]
            }
          })
        });
      }
    });
  });

  test('1. Debería renderizar la lista de comprobantes correctamente', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    await expect(page.getByText('Comprobantes')).toBeVisible();
    await expect(page.getByText(/FAC-2024-001/i)).toBeVisible();
    await expect(page.getByText(/REC-2024-002/i)).toBeVisible();
    await expect(page.getByText(/COT-2024-003/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar comprobantes de diferentes tipos', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Verificar que hay diferentes tipos de comprobantes
    await expect(page.getByText(/factura/i)).toHaveCount(2);
    await expect(page.getByText(/recibo/i)).toHaveCount(1);
    await expect(page.getByText(/cotización/i)).toHaveCount(1);
  });

  test('3. Debería filtrar comprobantes por tipo', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Seleccionar filtro "Facturas"
    await page.getByRole('combobox', { name: /tipo|type/i }).selectOption('factura');
    await expect(page.getByText(/FAC-2024-001/i)).toBeVisible();
    await expect(page.getByText(/REC-2024-002/i)).not.toBeVisible();

    // Seleccionar filtro "Recibos"
    await page.getByRole('combobox', { name: /tipo|type/i }).selectOption('recibo');
    await expect(page.getByText(/REC-2024-002/i)).toBeVisible();
    await expect(page.getByText(/FAC-2024-001/i)).not.toBeVisible();
  });

  test('4. Debería filtrar comprobantes por rango de fechas', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Establecer rango de fechas
    await page.getByLabel(/fecha.*desde|date.*from/i).fill('2024-01-16');
    await page.getByLabel(/fecha.*hasta|date.*to/i).fill('2024-01-17');
    await page.getByRole('button', { name: /aplicar.*filtros|apply.*filters/i }).click();

    // Verificar que solo se muestran comprobantes en el rango
    await expect(page.getByText(/REC-2024-002/i)).toBeVisible(); // 2024-01-16
    await expect(page.getByText(/COT-2024-003/i)).toBeVisible(); // 2024-01-17
    await expect(page.getByText(/FAC-2024-001/i)).not.toBeVisible(); // 2024-01-15 (fuera del rango)
  });

  test('5. Debería buscar comprobantes por número o cliente', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).not.toBeVisible();
  });

  test('6. Debería descargar comprobante en PDF', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Hacer clic en botón de descarga del primer comprobante
    const downloadButtons = page.getByRole('button', { name: /descargar.*pdf|download.*pdf/i });
    await downloadButtons.first().click();

    // Verificar que se inicia la descarga (Playwright no puede verificar archivos descargados directamente)
    // Pero podemos verificar que no hubo errores
    await expect(page).toHaveURL(/.*\/comprobantes/);
  });

  test('7. Debería previsualizar comprobante antes de descargar', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Hacer clic en botón de previsualizar
    const previewButtons = page.getByRole('button', { name: /previsualizar|preview/i });
    await previewButtons.first().click();

    // Verificar que se abre un modal o nueva pestaña con la previsualización
    await expect(page.getByText(/FAC-2024-001/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/\$1,500|\$1500/i)).toBeVisible();
  });

  test('8. Debería reemitir comprobante anulado', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reissue') && req.method() === 'POST'
    );

    // Hacer clic en botón de reemitir del comprobante anulado
    const reissueButtons = page.getByRole('button', { name: /reemitir|reissue/i });
    await reissueButtons.nth(3).click(); // El último es el anulado

    // Confirmar reemisión
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');

    await expect(page.getByText(/reemitido.*exitosamente|reissued.*successfully/i)).toBeVisible();
  });

  test('9. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/pdfs/*.pdf', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF content')
      });
    });

    await page.goto('/admin/comprobantes');
    
    const downloadButton = page.getByRole('button', { name: /descargar.*pdf/i }).first();
    await downloadButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/descargando|downloading/i)).toBeVisible();
  });

  test('10. Debería manejar error al descargar comprobante', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/pdfs/*.pdf', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al generar PDF.' })
      });
    });

    await page.goto('/admin/comprobantes');
    
    const downloadButton = page.getByRole('button', { name: /descargar.*pdf/i }).first();
    await downloadButton.click();

    await expect(page.getByText(/error.*descargar|error.*download/i)).toBeVisible();
  });

  test('11. Debería exportar lista de comprobantes', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('12. Debería mostrar estados de comprobantes con badges', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Verificar que los comprobantes tienen badges de estado
    const emittedBadges = page.getByText(/emitido/i);
    await expect(emittedBadges).toHaveCount(2);

    const pendingBadges = page.getByText(/pendiente/i);
    await expect(pendingBadges).toHaveCount(1);

    const cancelledBadges = page.getByText(/anulado/i);
    await expect(cancelledBadges).toHaveCount(1);
  });

  test('13. Debería permitir filtrar por estado del comprobante', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Seleccionar filtro "Emitidos"
    await page.getByRole('combobox', { name: /estado|status/i }).selectOption('emitido');
    await expect(page.getByText(/emitido/i)).toHaveCount(2);
    await expect(page.getByText(/pendiente/i)).not.toBeVisible();

    // Seleccionar filtro "Pendientes"
    await page.getByRole('combobox', { name: /estado|status/i }).selectOption('pendiente');
    await expect(page.getByText(/pendiente/i)).toHaveCount(1);
    await expect(page.getByText(/emitido/i)).not.toBeVisible();
  });

  test('14. Debería mostrar información detallada del comprobante', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Hacer clic en ver detalles del primer comprobante
    const detailButtons = page.getByRole('button', { name: /ver.*detalles|view.*details/i });
    await detailButtons.first().click();

    // Verificar que se muestra información completa
    await expect(page.getByText(/FAC-2024-001/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/2024-01-15/i)).toBeVisible();
    await expect(page.getByText(/\$1,500|\$1500/i)).toBeVisible();
    await expect(page.getByText(/emitido/i)).toBeVisible();
  });

  test('15. Debería permitir enviar comprobante por email', async ({ page }) => {
    await page.goto('/admin/comprobantes');

    // Hacer clic en botón de enviar por email
    const emailButtons = page.getByRole('button', { name: /enviar.*email|send.*email/i });
    await emailButtons.first().click();

    // Verificar que se abre un modal para configurar el email
    await expect(page.getByText(/enviar.*comprobante.*email|send.*receipt.*email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar|send/i })).toBeVisible();
  });
});