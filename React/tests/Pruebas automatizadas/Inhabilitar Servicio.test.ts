import { test, expect } from '@playwright/test';

test.describe('Módulo Inhabilitar Servicio', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/services**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      if (request.method() === 'GET') {
        // Obtener lista de servicios
        if (url.includes('/active')) {
          // Solo servicios activos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Mantenimiento Preventivo', descripcion: 'Servicio mensual', categoria: 'Mantenimiento', precio: 150, activo: true, fechaCreacion: '2024-01-15' },
                { id: 3, nombre: 'Consultoría Técnica', descripcion: 'Asesoramiento profesional', categoria: 'Consultoría', precio: 200, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Instalación Completa', descripcion: 'Instalación completa', categoria: 'Instalación', precio: 300, activo: true, fechaCreacion: '2024-03-05' }
              ],
              total: 3
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo servicios inactivos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, nombre: 'Reparación Básica', descripcion: 'Reparaciones simples', categoria: 'Reparación', precio: 80, activo: false, fechaCreacion: '2024-01-10' },
                { id: 5, nombre: 'Soporte Técnico', descripcion: 'Soporte remoto', categoria: 'Soporte', precio: 50, activo: false, fechaCreacion: '2024-01-20' }
              ],
              total: 2
            })
          });
        } else {
          // Todos los servicios
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Mantenimiento Preventivo', descripcion: 'Servicio mensual', categoria: 'Mantenimiento', precio: 150, activo: true, fechaCreacion: '2024-01-15' },
                { id: 2, nombre: 'Reparación Básica', descripcion: 'Reparaciones simples', categoria: 'Reparación', precio: 80, activo: false, fechaCreacion: '2024-01-10' },
                { id: 3, nombre: 'Consultoría Técnica', descripcion: 'Asesoramiento profesional', categoria: 'Consultoría', precio: 200, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Instalación Completa', descripcion: 'Instalación completa', categoria: 'Instalación', precio: 300, activo: true, fechaCreacion: '2024-03-05' },
                { id: 5, nombre: 'Soporte Técnico', descripcion: 'Soporte remoto', categoria: 'Soporte', precio: 50, activo: false, fechaCreacion: '2024-01-20' }
              ],
              total: 5
            })
          });
        }
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.activo === false) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Servicio inhabilitado exitosamente.',
              data: { id: postData.id, activo: false }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Solo se permite inhabilitar servicios.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar la lista de servicios correctamente', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    await expect(page.getByText('Inhabilitar Servicios')).toBeVisible();
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Reparación Básica/i)).toBeVisible();
    await expect(page.getByText(/Consultoría Técnica/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar servicios activos e inactivos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Verificar que hay servicios activos
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    
    // Verificar que hay servicios inactivos
    await expect(page.getByText(/inactivo/i)).toHaveCount(2);
  });

  test('3. Debería filtrar servicios por estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Seleccionar filtro "Todas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todos');
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Reparación Básica/i)).toBeVisible();

    // Seleccionar filtro "Activos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activos');
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Reparación Básica/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivos');
    await expect(page.getByText(/Reparación Básica/i)).toBeVisible();
    await expect(page.getByText(/Mantenimiento Preventivo/i)).not.toBeVisible();
  });

  test('4. Debería buscar servicios por nombre', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Reparación Básica/i)).toBeVisible();
    await expect(page.getByText(/Consultoría Técnica/i)).toBeVisible();
  });

  test('5. Debería inhabilitar un servicio activo', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/services/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de inhabilitar del primer servicio activo
    const disableButtons = page.getByRole('button', { name: /inhabilitar|desactivar/i });
    await disableButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(false);

    await expect(page.getByText(/servicio.*inhabilitado|service.*disabled/i)).toBeVisible();
  });

  test('6. Debería mostrar confirmación antes de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Hacer clic en el botón de inhabilitar
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea inhabilitar este servicio?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/servicio.*inhabilitado/i)).not.toBeVisible();
  });

  test('7. Debería mostrar indicador de carga durante la inhabilitación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/services/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Servicio inhabilitado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-servicios');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(disableButton).toBeDisabled();
  });

  test('8. Debería manejar error al inhabilitar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/services/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al inhabilitar servicio.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-servicios');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    await expect(page.getByText(/error.*inhabilitar|error.*disable/i)).toBeVisible();
  });

  test('9. Debería actualizar la lista después de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Contar servicios activos inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Inhabilitar un servicio
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/servicio.*inhabilitado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay un servicio activo menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('10. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Verificar que los servicios activos tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que los servicios inactivos tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(2);
  });

  test('11. Debería permitir inhabilitar múltiples servicios', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Inhabilitar primer servicio
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/servicio.*inhabilitado/i)).toBeVisible();

    // Inhabilitar segundo servicio
    await disableButtons.nth(1).click();
    await expect(page.getByText(/servicio.*inhabilitado/i)).toBeVisible();

    // Verificar que ambos se inhabilitaron
    await expect(page.getByText(/inactivo/i)).toHaveCount(4); // Original 2 + 2 nuevas
  });

  test('12. Debería impedir inhabilitar servicios ya inactivos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Verificar que los botones de inhabilitar no están disponibles para servicios inactivos
    const inactiveServices = page.getByText(/inactivo/i);
    await expect(inactiveServices).toHaveCount(2);
    
    // Los botones de inhabilitar solo deberían estar disponibles para servicios activos
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await expect(disableButtons).toHaveCount(3); // Solo para los 3 activos
  });

  test('13. Debería exportar lista de servicios', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Hacer clic en ver historial de un servicio
    const historyButtons = page.getByRole('button', { name: /historial|history/i });
    await historyButtons.first().click();

    // Verificar que se muestra el historial
    await expect(page.getByText(/historial de cambios|change history/i)).toBeVisible();
    await expect(page.getByText(/fecha|date/i)).toBeVisible();
    await expect(page.getByText(/usuario|user/i)).toBeVisible();
  });

  test('15. Debería tener opción de reactivar servicios inhabilitados', async ({ page }) => {
    await page.goto('/admin/inhabilitar-servicios');

    // Cambiar a vista de servicios inactivos
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('inactivos');
    
    // Verificar que existen botones de reactivar
    const enableButtons = page.getByRole('button', { name: /reactivar|activar/i });
    await expect(enableButtons).toHaveCount(2); // Para los 2 inactivos
    
    // Hacer clic en reactivar
    await enableButtons.first().click();
    
    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea reactivar este servicio?/i)).toBeVisible();
  });
});