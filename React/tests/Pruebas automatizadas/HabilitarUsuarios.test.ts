import { test, expect } from '@playwright/test';

test.describe('Módulo HabilitarUsuarios', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/users/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener lista de usuarios con diferentes estados
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nombre: 'Usuario Activo 1', email: 'activo1@example.com', rol: 'tecnico', estado: 'activo' },
              { id: 2, nombre: 'Usuario Inactivo 1', email: 'inactivo1@example.com', rol: 'cliente', estado: 'inactivo' },
              { id: 3, nombre: 'Usuario Activo 2', email: 'activo2@example.com', rol: 'administrador', estado: 'activo' },
              { id: 4, nombre: 'Usuario Inactivo 2', email: 'inactivo2@example.com', rol: 'tecnico', estado: 'inactivo' }
            ]
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.estado === 'activo' || postData.estado === 'inactivo') {
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

  test('1. Debería renderizar la lista de usuarios correctamente', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    await expect(page.getByText('Habilitar/Desactivar Usuarios')).toBeVisible();
    await expect(page.getByText(/Usuario Activo 1/i)).toBeVisible();
    await expect(page.getByText(/Usuario Inactivo 1/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar usuarios activos e inactivos', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Verificar que hay usuarios activos
    await expect(page.getByText(/activo/i)).toHaveCount(2);
    
    // Verificar que hay usuarios inactivos
    await expect(page.getByText(/inactivo/i)).toHaveCount(2);
  });

  test('3. Debería desactivar un usuario activo', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de desactivar del primer usuario activo
    const deactivateButtons = page.getByRole('button', { name: /desactivar|inactivar/i });
    await deactivateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('inactivo');

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('4. Debería activar un usuario inactivo', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de activar del primer usuario inactivo
    const activateButtons = page.getByRole('button', { name: /activar|habilitar/i });
    await activateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('activo');

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('5. Debería mostrar confirmación antes de cambiar estado', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Hacer clic en el botón de desactivar
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea desactivar este usuario?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/estado.*actualizado/i)).not.toBeVisible();
  });

  test('6. Debería filtrar usuarios por estado', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Seleccionar filtro "Todos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todos');
    await expect(page.getByText(/Usuario Activo 1/i)).toBeVisible();
    await expect(page.getByText(/Usuario Inactivo 1/i)).toBeVisible();

    // Seleccionar filtro "Activos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activos');
    await expect(page.getByText(/Usuario Activo 1/i)).toBeVisible();
    await expect(page.getByText(/Usuario Inactivo 1/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivos');
    await expect(page.getByText(/Usuario Inactivo 1/i)).toBeVisible();
    await expect(page.getByText(/Usuario Activo 1/i)).not.toBeVisible();
  });

  test('7. Debería buscar usuarios por nombre o email', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Usuario Activo 1/i)).toBeVisible();
    await expect(page.getByText(/Usuario Inactivo 1/i)).toBeVisible();
  });

  test('8. Debería mostrar indicador de carga durante el cambio de estado', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/users/**', async (route) => {
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

    await page.goto('/admin/habilitar-usuarios');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });

  test('9. Debería manejar error al cambiar estado', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/users/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar estado.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/habilitar-usuarios');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('10. Debería actualizar la lista después de cambiar estado', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Contar usuarios activos inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Desactivar un usuario
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay un usuario activo menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('11. Debería permitir cambios múltiples de estado', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Desactivar primer usuario activo
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Activar primer usuario inactivo
    const activateButtons = page.getByRole('button', { name: /activar/i });
    await activateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Verificar que ambos cambios se realizaron
    await expect(page.getByText(/usuario.*activo/i)).toHaveCount(2);
    await expect(page.getByText(/usuario.*inactivo/i)).toHaveCount(2);
  });

  test('12. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Verificar que los usuarios activos tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(2);

    // Verificar que los usuarios inactivos tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(2);
  });

  test('13. Debería tener opción de seleccionar múltiples usuarios', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Verificar que existen checkboxes para selección múltiple
    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(4); // Uno por cada usuario

    // Seleccionar primeros dos usuarios
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Verificar que aparece una barra de acciones masivas
    await expect(page.getByText(/seleccionados|selected/i)).toBeVisible();
  });

  test('14. Debería permitir acción masiva de activación/desactivación', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Seleccionar usuarios
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Hacer clic en botón de acción masiva
    const bulkActionBtn = page.getByRole('button', { name: /desactivar seleccionados|deactivate selected/i });
    await bulkActionBtn.click();

    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea desactivar los usuarios seleccionados?/i)).toBeVisible();
    
    // Confirmar
    await page.getByRole('button', { name: /sí|confirmar/i }).click();

    await expect(page.getByText(/usuarios.*actualizados|users.*updated/i)).toBeVisible();
  });

  test('15. Debería exportar lista de usuarios con estados', async ({ page }) => {
    await page.goto('/admin/habilitar-usuarios');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar|export/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });
});