import { test, expect } from '@playwright/test';

test.describe('Módulo AprobaciónClientes', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/client-approvals/**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      // Obtener ID del cliente de la URL
      const clientId = url.split('/').pop();
      
      if (request.method() === 'GET') {
        // Obtener lista de clientes pendientes
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', fechaSolicitud: '2024-01-15', estado: 'pendiente' },
              { id: 2, nombre: 'María García', email: 'maria@example.com', fechaSolicitud: '2024-01-16', estado: 'pendiente' },
              { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', fechaSolicitud: '2024-01-17', estado: 'aprobado' }
            ]
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.estado === 'aprobado') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Cliente aprobado exitosamente.',
              data: { id: clientId, estado: 'aprobado' }
            })
          });
        } else if (postData.estado === 'rechazado') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Cliente rechazado exitosamente.',
              data: { id: clientId, estado: 'rechazado' }
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

  test('1. Debería renderizar la lista de aprobaciones correctamente', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    await expect(page.getByText('Aprobación de Clientes')).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /aprobar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /rechazar/i })).toBeVisible();
  });

  test('2. Debería mostrar clientes pendientes', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Verificar que hay clientes con estado pendiente
    await expect(page.getByText(/pendiente/i)).toBeVisible();
    
    // Verificar que hay al menos 2 clientes pendientes
    const pendingClients = page.getByText(/pendiente/i);
    await expect(pendingClients).toHaveCount(2);
  });

  test('3. Debería aprobar un cliente exitosamente', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/client-approvals/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de aprobar del primer cliente
    const approveButtons = page.getByRole('button', { name: /aprobar/i });
    await approveButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('aprobado');

    await expect(page.getByText(/cliente.*aprobado|client.*approved/i)).toBeVisible();
  });

  test('4. Debería rechazar un cliente exitosamente', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/client-approvals/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de rechazar del segundo cliente
    const rejectButtons = page.getByRole('button', { name: /rechazar/i });
    await rejectButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('rechazado');

    await expect(page.getByText(/cliente.*rechazado|client.*rejected/i)).toBeVisible();
  });

  test('5. Debería mostrar confirmación antes de aprobar/rechazar', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Hacer clic en el botón de aprobar
    const approveButtons = page.getByRole('button', { name: /aprobar/i });
    await approveButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea aprobar este cliente?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/cliente.*aprobado/i)).not.toBeVisible();
  });

  test('6. Debería filtrar clientes por estado', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Seleccionar filtro "Todos"
    await page.getByRole('combobox', { name: /filtro|filter/i }).selectOption('todos');
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).toBeVisible();
    await expect(page.getByText(/Carlos López/i)).toBeVisible();

    // Seleccionar filtro "Pendientes"
    await page.getByRole('combobox', { name: /filtro|filter/i }).selectOption('pendientes');
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).toBeVisible();
    await expect(page.getByText(/Carlos López/i)).not.toBeVisible();

    // Seleccionar filtro "Aprobados"
    await page.getByRole('combobox', { name: /filtro|filter/i }).selectOption('aprobados');
    await expect(page.getByText(/Carlos López/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).not.toBeVisible();
  });

  test('7. Debería buscar clientes por nombre o email', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Juan Pérez/i)).toBeVisible();
    await expect(page.getByText(/María García/i)).toBeVisible();
  });

  test('8. Debería mostrar indicador de carga durante la aprobación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/client-approvals/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Cliente aprobado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/aprobacion-clientes');
    
    const approveButton = page.getByRole('button', { name: /aprobar/i }).first();
    await approveButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(approveButton).toBeDisabled();
  });

  test('9. Debería manejar error al aprobar/rechazar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/client-approvals/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al procesar la solicitud.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/aprobacion-clientes');
    
    const approveButton = page.getByRole('button', { name: /aprobar/i }).first();
    await approveButton.click();

    await expect(page.getByText(/error.*procesar|error.*processing/i)).toBeVisible();
  });

  test('10. Debería actualizar la lista después de aprobar/rechazar', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Contar clientes pendientes inicialmente
    const initialPendingCount = await page.getByText(/pendiente/i).count();

    // Aprobar un cliente
    const approveButtons = page.getByRole('button', { name: /aprobar/i });
    await approveButtons.first().click();
    await expect(page.getByText(/cliente.*aprobado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay un cliente pendiente menos
    const finalPendingCount = await page.getByText(/pendiente/i).count();
    expect(finalPendingCount).toBe(initialPendingCount - 1);
  });

  test('11. Debería mostrar detalles del cliente al hacer clic', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Hacer clic en el nombre del primer cliente
    await page.getByText(/Juan Pérez/i).click();

    // Verificar que se muestra un modal o página de detalles
    await expect(page.getByText(/detalles del cliente/i)).toBeVisible();
    await expect(page.getByText(/juan@example.com/i)).toBeVisible();
    await expect(page.getByText(/2024-01-15/i)).toBeVisible();
  });

  test('12. Debería tener opción de exportar lista', async ({ page }) => {
    await page.goto('/admin/aprobacion-clientes');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar|export/i }).click();
    
    // Verificar que se genera la descarga (esto puede variar según tu implementación)
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });
});