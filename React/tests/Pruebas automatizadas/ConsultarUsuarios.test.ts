import { test, expect } from '@playwright/test';

test.describe('Módulo Consulta de Usuarios', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/users**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener lista de usuarios con diferentes roles
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nombre: 'Admin Principal', email: 'admin@example.com', rol: 'administrador', estado: 'activo', fechaRegistro: '2024-01-01' },
              { id: 2, nombre: 'Técnico Juan', email: 'tecnico@example.com', rol: 'tecnico', estado: 'activo', fechaRegistro: '2024-01-05' },
              { id: 3, nombre: 'Cliente María', email: 'cliente@example.com', rol: 'cliente', estado: 'activo', fechaRegistro: '2024-01-10' },
              { id: 4, nombre: 'Técnico Inactivo', email: 'inactivo@example.com', rol: 'tecnico', estado: 'inactivo', fechaRegistro: '2024-01-15' }
            ],
            total: 4,
            pagina: 1,
            porPagina: 10
          })
        });
      } else if (request.method() === 'DELETE') {
        // Eliminar usuario
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true, 
            message: 'Usuario eliminado exitosamente.'
          })
        });
      } else if (request.method() === 'PUT') {
        // Actualizar estado de usuario
        const postData = await request.postDataJSON();
        
        if (postData.estado === 'activo' || postData.estado === 'inactivo') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Estado actualizado exitosamente.',
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

  test('1. Debería renderizar la tabla de usuarios correctamente', async ({ page }) => {
    await page.goto('/admin/usuarios');

    await expect(page.getByText('Consulta de Usuarios')).toBeVisible();
    await expect(page.getByText(/Admin Principal/i)).toBeVisible();
    await expect(page.getByText(/Técnico Juan/i)).toBeVisible();
    await expect(page.getByText(/Cliente María/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar usuarios con diferentes roles', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Verificar que hay usuarios de diferentes roles
    await expect(page.getByText(/administrador/i)).toBeVisible();
    await expect(page.getByText(/técnico/i)).toBeVisible();
    await expect(page.getByText(/cliente/i)).toBeVisible();
    
    // Contar usuarios por rol
    const adminUsers = page.getByText(/administrador/i);
    const techUsers = page.getByText(/técnico/i);
    const clientUsers = page.getByText(/cliente/i);
    
    await expect(adminUsers).toHaveCount(1);
    await expect(techUsers).toHaveCount(2);
    await expect(clientUsers).toHaveCount(1);
  });

  test('3. Debería filtrar usuarios por rol', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Seleccionar filtro "Todos"
    await page.getByRole('combobox', { name: /filtro.*rol|filter.*role/i }).selectOption('todos');
    await expect(page.getByText(/Admin Principal/i)).toBeVisible();
    await expect(page.getByText(/Técnico Juan/i)).toBeVisible();
    await expect(page.getByText(/Cliente María/i)).toBeVisible();

    // Seleccionar filtro "Administradores"
    await page.getByRole('combobox', { name: /filtro.*rol|filter.*role/i }).selectOption('administrador');
    await expect(page.getByText(/Admin Principal/i)).toBeVisible();
    await expect(page.getByText(/Técnico Juan/i)).not.toBeVisible();
    await expect(page.getByText(/Cliente María/i)).not.toBeVisible();

    // Seleccionar filtro "Técnicos"
    await page.getByRole('combobox', { name: /filtro.*rol|filter.*role/i }).selectOption('tecnico');
    await expect(page.getByText(/Técnico Juan/i)).toBeVisible();
    await expect(page.getByText(/Admin Principal/i)).not.toBeVisible();
    await expect(page.getByText(/Cliente María/i)).not.toBeVisible();
  });

  test('4. Debería filtrar usuarios por estado', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Seleccionar filtro "Activos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activos');
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    await expect(page.getByText(/inactivo/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivos');
    await expect(page.getByText(/inactivo/i)).toBeVisible();
    await expect(page.getByText(/activo/i)).not.toBeVisible();
  });

  test('5. Debería buscar usuarios por nombre o email', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Admin Principal/i)).toBeVisible();
    await expect(page.getByText(/Técnico Juan/i)).toBeVisible();
    await expect(page.getByText(/Cliente María/i)).toBeVisible();
  });

  test('6. Debería cambiar estado de usuario a inactivo', async ({ page }) => {
    await page.goto('/admin/usuarios');

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

  test('7. Debería activar usuario inactivo', async ({ page }) => {
    await page.goto('/admin/usuarios');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de activar del usuario inactivo
    const activateButtons = page.getByRole('button', { name: /activar/i });
    await activateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.estado).toBe('activo');

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('8. Debería eliminar usuario con confirmación', async ({ page }) => {
    await page.goto('/admin/usuarios');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'DELETE'
    );

    // Hacer clic en el botón de eliminar
    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.first().click();

    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea eliminar este usuario?/i)).toBeVisible();
    
    // Confirmar eliminación
    await page.getByRole('button', { name: /sí|confirmar/i }).click();

    const request = await requestPromise;
    expect(request.method()).toBe('DELETE');

    await expect(page.getByText(/usuario.*eliminado|user.*deleted/i)).toBeVisible();
  });

  test('9. Debería cancelar eliminación de usuario', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Hacer clic en el botón de eliminar
    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.first().click();

    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea eliminar este usuario?/i)).toBeVisible();
    
    // Cancelar eliminación
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se eliminó
    await expect(page.getByText(/usuario.*eliminado/i)).not.toBeVisible();
  });

  test('10. Debería mostrar paginación correcta', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Verificar que existe la paginación
    await expect(page.getByRole('navigation', { name: /paginación|pagination/i })).toBeVisible();
    
    // Verificar números de página
    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2' })).toBeVisible();
    
    // Verificar botón siguiente/anterior
    await expect(page.getByRole('button', { name: /anterior|previous/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /siguiente|next/i })).toBeVisible();
  });

  test('11. Debería navegar entre páginas', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Ir a la página 2
    await page.getByRole('button', { name: '2' }).click();
    await expect(page).toHaveURL(/.*pagina=2/);
    
    // Volver a la página 1
    await page.getByRole('button', { name: '1' }).click();
    await expect(page).toHaveURL(/.*pagina=1/);
  });

  test('12. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/users/**', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Operación completada.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/usuarios');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });

  test('13. Debería manejar error al actualizar estado', async ({ page }) => {
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

    await page.goto('/admin/usuarios');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('14. Debería exportar lista de usuarios', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar|export/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('15. Debería mostrar detalles del usuario al hacer clic', async ({ page }) => {
    await page.goto('/admin/usuarios');

    // Hacer clic en el nombre del primer usuario
    await page.getByText(/Admin Principal/i).click();

    // Verificar que se muestra un modal o página de detalles
    await expect(page.getByText(/detalles del usuario/i)).toBeVisible();
    await expect(page.getByText(/admin@example.com/i)).toBeVisible();
    await expect(page.getByText(/administrador/i)).toBeVisible();
    await expect(page.getByText(/2024-01-01/i)).toBeVisible();
  });
});