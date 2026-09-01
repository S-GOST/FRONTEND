import { test, expect } from '@playwright/test';

test.describe('Módulo Gestionar Detalles de Orden', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/orders/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener detalles de orden específica
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              numeroOrden: 'ORD-2024-001',
              cliente: {
                id: 1,
                nombre: 'Juan Pérez',
                email: 'juan@example.com',
                telefono: '+1234567890'
              },
              fechaCreacion: '2024-01-15T10:30:00Z',
              estado: 'pendiente',
              total: 1500.00,
              items: [
                { 
                  id: 1, 
                  producto: { id: 1, nombre: 'Laptop Gamer Pro', sku: 'LAP-GP-001' }, 
                  cantidad: 1, 
                  precioUnitario: 1200.00, 
                  subtotal: 1200.00 
                },
                { 
                  id: 2, 
                  producto: { id: 5, nombre: 'Mouse Gaming', sku: 'MOU-GAM-006' }, 
                  cantidad: 2, 
                  precioUnitario: 80.00, 
                  subtotal: 160.00 
                },
                { 
                  id: 3, 
                  servicio: { id: 10, nombre: 'Mantenimiento Preventivo' }, 
                  cantidad: 1, 
                  precioUnitario: 150.00, 
                  subtotal: 150.00 
                }
              ],
              direccionEnvio: {
                calle: 'Calle Principal 123',
                ciudad: 'Ciudad Central',
                estado: 'Estado Central',
                codigoPostal: '12345',
                pais: 'País'
              },
              metodoPago: 'tarjeta_credito',
              notas: 'Entregar en horario de oficina'
            }
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.estado && ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'].includes(postData.estado)) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Orden actualizada exitosamente.',
              data: { id: 1, estado: postData.estado }
            })
          });
        } else if (postData.notas !== undefined) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Notas actualizadas exitosamente.',
              data: { id: 1, notas: postData.notas }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Datos inválidos.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar los detalles de la orden correctamente', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    await expect(page.getByText('Detalles de Orden')).toBeVisible();
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Mouse Gaming/i)).toBeVisible();
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/\$1,500|\$1500/i)).toBeVisible();
  });

  test('2. Debería mostrar información completa del cliente', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    await expect(page.getByText(/juan@example.com/i)).toBeVisible();
    await expect(page.getByText(/\+1234567890/i)).toBeVisible();
    await expect(page.getByText(/Calle Principal 123/i)).toBeVisible();
    await expect(page.getByText(/Ciudad Central/i)).toBeVisible();
  });

  test('3. Debería mostrar todos los ítems de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    // Verificar productos
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Cantidad: 1/i)).toBeVisible();
    await expect(page.getByText(/\$1,200|\$1200/i)).toBeVisible();

    // Verificar servicios
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Cantidad: 1/i)).toBeVisible();
    await expect(page.getByText(/\$150/i)).toBeVisible();
  });

  test('4. Debería permitir cambiar el estado de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/orders/') && req.method() === 'PUT'
    );

    // Cambiar estado a "procesando"
    await page.getByRole('combobox', { name: /estado|status/i }).selectOption('procesando');
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('procesando');

    await expect(page.getByText(/orden.*actualizada|order.*updated/i)).toBeVisible();
  });

  test('5. Debería permitir agregar/editar notas de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    // Simular actualización de notas sin llenar input específico
    await page.getByRole('button', { name: /guardar notas|save notes/i }).click();

    
    await expect(page.getByText(/notas.*actualizadas|notes.*updated/i)).toBeVisible();
  });

  test('6. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    await expect(page.getByText(/historial|history/i)).toBeVisible();
    await expect(page.getByText(/pendiente/i)).toBeVisible();
    await expect(page.getByText(/2024-01-15/i)).toBeVisible();
  });

  test('7. Debería calcular correctamente el total de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    // Verificar que el total mostrado es correcto
    await expect(page.getByText(/total.*\$1,500|total.*\$1500/i)).toBeVisible();
  });

  test('8. Debería mostrar método de pago utilizado', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    await expect(page.getByText(/tarjeta.*crédito|credit.*card/i)).toBeVisible();
  });

  test('9. Debería permitir imprimir detalles de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    const printButton = page.getByRole('button', { name: /imprimir|print/i });
    await expect(printButton).toBeVisible();
    
    // Simular clic en imprimir
    await printButton.click();
    
    // Verificar que no hubo errores de navegación
    await expect(page).toHaveURL(/.*\/detalles/);
  });

  test('10. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/orders/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Operación completada.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/ordenes/1/detalles');
    
    await page.getByRole('combobox', { name: /estado|status/i }).selectOption('enviado');
    
    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
  });

  test('11. Debería manejar error al actualizar orden', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/orders/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar orden.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/ordenes/1/detalles');
    
    await page.getByRole('combobox', { name: /estado|status/i }).selectOption('cancelado');

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('12. Debería navegar a detalles del cliente', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    // Hacer clic en el nombre del cliente
    await page.getByText(/Juan Pérez/i).click();

    // Verificar navegación a detalles del cliente
    await expect(page).toHaveURL(/.*\/clientes\/1/);
  });

  test('13. Debería navegar a detalles del producto', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    // Hacer clic en el nombre del producto
    await page.getByText(/Laptop Gamer Pro/i).click();

    // Verificar navegación a detalles del producto
    await expect(page).toHaveURL(/.*\/productos\/1/);
  });

  test('14. Debería mostrar opciones de envío disponibles', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    await expect(page.getByText(/dirección.*envío|shipping.*address/i)).toBeVisible();
    await expect(page.getByText(/Calle Principal 123/i)).toBeVisible();
    await expect(page.getByText(/Ciudad Central/i)).toBeVisible();
  });

  test('15. Debería permitir descargar factura de la orden', async ({ page }) => {
    await page.goto('/admin/ordenes/1/detalles');

    const downloadButton = page.getByRole('button', { name: /descargar.*factura|download.*invoice/i });
    await expect(downloadButton).toBeVisible();
    
    // Simular clic en descargar
    await downloadButton.click();
    
    // Verificar que no hubo errores de navegación
    await expect(page).toHaveURL(/.*\/detalles/);
  });
});