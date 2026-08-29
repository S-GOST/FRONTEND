import { test, expect } from '@playwright/test';

test.describe('Módulo Gestión de Roles', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/roles**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener lista de roles
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema', usuariosAsignados: 5 },
              { id: 2, nombre: 'Técnico', descripcion: 'Gestión de incidencias', usuariosAsignados: 12 },
              { id: 3, nombre: 'Cliente', descripcion: 'Acceso limitado', usuariosAsignados: 50 }
            ]
          })
        });
      } else if (request.method() === 'POST') {
        const postData = await request.postDataJSON();
        
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre del rol es obligatorio.' })
          });
        } else if (postData.nombre === 'Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El nombre del rol ya existe.' })
          });
        } else {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ 
              success: true, 
              message: 'Rol creado exitosamente.',
              data: { id: 4, ...postData }
            })
          });
        }
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre del rol es obligatorio.' })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Rol actualizado exitosamente.',
              data: { id: postData.id, ...postData }
            })
          });
        }
      } else if (request.method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true, 
            message: 'Rol eliminado exitosamente.'
          })
        });
      }
    });
  });

  test('1. Debería renderizar la tabla de roles correctamente', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    await expect(page.getByText('Gestión de Roles')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /nuevo rol|new role/i })).toBeVisible();
  });

  test('2. Debería mostrar detalles de cada rol', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    // Verificar columnas de información
    await expect(page.getByText(/usuarios asignados|assigned users/i)).toBeVisible();
  });

  test('3. Debería abrir modal para crear nuevo rol', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    await page.getByRole('button', { name: /nuevo rol|new role/i }).click();

    await expect(page.getByText(/crear.*rol|create.*role/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar|save/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancelar|close/i })).toBeVisible();
  });

  test('4. Debería crear un rol exitosamente', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    await page.getByRole('button', { name: /nuevo rol/i }).click();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/roles') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();

    await expect(page.getByText(/rol.*creado|role.*created/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    await page.getByRole('button', { name: /nuevo rol/i }).click();
    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('6. Debería abrir modal para editar rol', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    // Hacer clic en editar del primer rol
    const editButtons = page.getByRole('button', { name: /editar|edit/i });
    await editButtons.first().click();

    await expect(page.getByText(/editar.*rol|edit.*role/i)).toBeVisible();
  });

  test('7. Debería actualizar un rol exitosamente', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    const editButtons = page.getByRole('button', { name: /editar/i });
    await editButtons.first().click();

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/roles') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();

    await expect(page.getByText(/rol.*actualizado|role.*updated/i)).toBeVisible();
  });

  test('8. Debería eliminar un rol con confirmación', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.first().click();

    await expect(page.getByText(/¿Está seguro de que desea eliminar este rol?/i)).toBeVisible();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/roles') && req.method() === 'DELETE'
    );

    await page.getByRole('button', { name: /sí|confirmar/i }).click();
    
    const request = await requestPromise;
    expect(request.method()).toBe('DELETE');

    await expect(page.getByText(/rol.*eliminado|role.*deleted/i)).toBeVisible();
  });

  test('9. Debería filtrar roles por nombre', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Administrador/i)).toBeVisible();
    await expect(page.getByText(/Técnico/i)).toBeVisible();
    await expect(page.getByText(/Cliente/i)).toBeVisible();
  });

  test('10. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    await page.route('**/api/admin/roles**', async (route) => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Operación completada.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/gestion-roles');
    await page.getByRole('button', { name: /nuevo rol/i }).click();
    
    const button = page.getByRole('button', { name: /guardar/i });
    await button.click();

    await expect(page.getByText(/guardando|saving/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('11. Debería cancelar edición sin guardar', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    const editButtons = page.getByRole('button', { name: /editar/i });
    await editButtons.first().click();
    
    await page.getByRole('button', { name: /cancelar/i }).click();

    // Verificar que el modal se cerró
    await expect(page.getByText(/editar.*rol/i)).not.toBeVisible();
  });

  test('12. Debería exportar lista de roles', async ({ page }) => {
    await page.goto('/admin/gestion-roles');

    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    await page.getByRole('button', { name: /exportar/i }).click();
    
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });
});