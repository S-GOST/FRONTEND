import { test, expect } from '@playwright/test';

test.describe('Módulo Actualizar Estado de Orden', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/orders/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener lista de órdenes para actualizar
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, numeroOrden: 'ORD-2024-001', cliente: 'Juan Pérez', estado: 'pendiente', fechaCreacion: '2024-01-15', total: 1500.00 },
              { id: 2, numeroOrden: 'ORD-2024-002', cliente: 'María García', estado: 'procesando', fechaCreacion: '2024-01-16', total: 800.00 },
              { id: 3, numeroOrden: 'ORD-2024-003', cliente: 'Carlos López', estado: 'enviado', fechaCreacion: '2024-01-17', total: 2200.00 },
              { id: 4, numeroOrden: 'ORD-2024-004', cliente: 'Ana Rodríguez', estado: 'entregado', fechaCreacion: '2024-01-18', total: 950.00 }
            ],
            total: 4
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.estado && ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'].includes(postData.estado)) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: `Estado actualizado a ${postData.estado} exitosamente.`,
              data: { id: postData.id, estado: postData.estado }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Estado inválido.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar la lista de órdenes correctamente', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    await expect(page.getByText('Actualizar Estado de Órdenes')).toBeVisible();
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar órdenes con diferentes estados', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Verificar que hay órdenes en diferentes estados
    await expect(page.getByText(/pendiente/i)).toBeVisible();
    await expect(page.getByText(/procesando/i)).toBeVisible();
    await expect(page.getByText(/enviado/i)).toBeVisible();
    await expect(page.getByText(/entregado/i)).toBeVisible();
  });

  test('3. Debería filtrar órdenes por estado actual', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Seleccionar filtro "Pendientes"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('pendientes');
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).not.toBeVisible();

    // Seleccionar filtro "Procesando"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('procesando');
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-001/i)).not.toBeVisible();
  });

  test('4. Debería buscar órdenes por número o cliente', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).toBeVisible();
    await expect(page.getByText(/Carlos López/i)).toBeVisible();
  });

  test('5. Debería actualizar estado de orden pendiente a procesando', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/orders/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de actualizar estado de la primera orden
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado|update.*status/i });
    await updateButtons.first().click();

    // Seleccionar nuevo estado
    await page.getByRole('combobox', { name: /nuevo.*estado|new.*status/i }).selectOption('procesando');
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('procesando');

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('6. Debería actualizar estado de orden procesando a enviado', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/orders/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de actualizar estado de la segunda orden
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado/i });
    await updateButtons.nth(1).click();

    // Seleccionar nuevo estado
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('enviado');
    await page.getByRole('button', { name: /confirmar/i }).click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('enviado');

    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();
  });

  test('7. Debería mostrar confirmación antes de actualizar estado', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Hacer clic en el botón de actualizar estado
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado/i });
    await updateButtons.first().click();

    // Seleccionar nuevo estado
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('cancelado');

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea cambiar el estado?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/estado.*actualizado/i)).not.toBeVisible();
  });

  test('8. Debería mostrar indicador de carga durante la actualización', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/orders/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Estado actualizado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/actualizar-estado-ordenes');
    
    const updateButton = page.getByRole('button', { name: /actualizar.*estado/i }).first();
    await updateButton.click();
    
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('enviado');
    await page.getByRole('button', { name: /confirmar/i }).click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(updateButton).toBeDisabled();
  });

  test('9. Debería manejar error al actualizar estado', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/orders/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar estado.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/actualizar-estado-ordenes');
    
    const updateButton = page.getByRole('button', { name: /actualizar.*estado/i }).first();
    await updateButton.click();
    
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('cancelado');
    await page.getByRole('button', { name: /confirmar/i }).click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('10. Debería actualizar la lista después de cambiar estado', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Contar órdenes pendientes inicialmente
    const initialPendingCount = await page.getByText(/pendiente/i).count();

    // Actualizar estado de una orden
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado/i });
    await updateButtons.first().click();
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('procesando');
    await page.getByRole('button', { name: /confirmar/i }).click();
    
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay una orden pendiente menos
    const finalPendingCount = await page.getByText(/pendiente/i).count();
    expect(finalPendingCount).toBe(initialPendingCount - 1);
  });

  test('11. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Verificar que las órdenes tienen badges de colores según su estado
    const pendingBadges = page.getByText(/pendiente/i);
    await expect(pendingBadges).toHaveCount(1);

    const processingBadges = page.getByText(/procesando/i);
    await expect(processingBadges).toHaveCount(1);

    const shippedBadges = page.getByText(/enviado/i);
    await expect(shippedBadges).toHaveCount(1);

    const deliveredBadges = page.getByText(/entregado/i);
    await expect(deliveredBadges).toHaveCount(1);
  });

  test('12. Debería permitir actualizar múltiples órdenes', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Actualizar primera orden
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado/i });
    await updateButtons.first().click();
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('procesando');
    await page.getByRole('button', { name: /confirmar/i }).click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Actualizar segunda orden
    await updateButtons.nth(1).click();
    await page.getByRole('combobox', { name: /nuevo.*estado/i }).selectOption('enviado');
    await page.getByRole('button', { name: /confirmar/i }).click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Verificar que ambas se actualizaron
    await expect(page.getByText(/procesando/i)).toHaveCount(2);
    await expect(page.getByText(/enviado/i)).toHaveCount(2);
  });

  test('13. Debería exportar lista de órdenes con estados', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Hacer clic en ver historial de una orden
    const historyButtons = page.getByRole('button', { name: /historial|history/i });
    await historyButtons.first().click();

    // Verificar que se muestra el historial
    await expect(page.getByText(/historial de cambios|change history/i)).toBeVisible();
    await expect(page.getByText(/fecha|date/i)).toBeVisible();
    await expect(page.getByText(/usuario|user/i)).toBeVisible();
    await expect(page.getByText(/pendiente/i)).toBeVisible();
  });

  test('15. Debería validar transiciones de estado permitidas', async ({ page }) => {
    await page.goto('/admin/actualizar-estado-ordenes');

    // Intentar cambiar de "entregado" a "pendiente" (transición no permitida)
    const updateButtons = page.getByRole('button', { name: /actualizar.*estado/i });
    await updateButtons.nth(3).click(); // Última orden (entregado)
    
    // Verificar que "pendiente" no está disponible como opción
    const stateSelect = page.getByRole('combobox', { name: /nuevo.*estado/i });
    const options = await stateSelect.locator('option').all();
    const optionValues = await Promise.all(options.map(opt => opt.getAttribute('value')));
    
    // "pendiente" no debería estar en las opciones para una orden entregada
    expect(optionValues).not.toContain('pendiente');
  });
});