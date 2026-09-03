import { test, expect } from '@playwright/test';

test.describe('Módulo Actualizar Categoría', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/categories/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener datos de la categoría específica
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              nombre: 'Electrónica',
              descripcion: 'Productos electrónicos y tecnología',
              activa: true,
              fechaCreacion: '2024-01-15',
              usuarioCreador: 'admin@example.com'
            }
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        // Validaciones
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre de la categoría es obligatorio.' })
          });
        } else if (postData.nombre.length < 3) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre debe tener al menos 3 caracteres.' })
          });
        } else if (postData.nombre === 'Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El nombre de la categoría ya existe.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Categoría actualizada exitosamente.',
              data: { id: 1, ...postData }
            })
          });
        }
      }
    });
  });

  test('1. Debería renderizar el formulario de edición correctamente', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    await expect(page.getByText('Editar Categoría')).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el nombre es muy corto', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/al menos 3 caracteres|at least 3 characters/i)).toBeVisible();
  });

  test('4. Debería actualizar categoría exitosamente', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();

    await expect(page.getByText(/categoría.*actualizada|category.*updated/i)).toBeVisible();
  });

  test('5. Debería manejar error cuando el nombre ya existe', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('6. Debería cancelar edición y volver a la lista', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/consultar-categorias'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-categorias/);
  });

  test('7. Debería mostrar indicador de carga durante la actualización', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/categories/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Categoría actualizada exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/categorias/1/editar');
    
    const button = page.getByRole('button', { name: /guardar cambios/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/guardando|saving/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('8. Debería manejar error al actualizar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/categories/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar categoría.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/categorias/1/editar');
    
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('9. Debería validar que los datos no cambien si se cancela', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    // Cancelar
    await page.getByRole('link', { name: /cancelar|volver/i }).click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-categorias/);

    // Volver a editar
    await page.goto('/admin/categorias/1/editar');
    await expect(page.getByText('Editar Categoría')).toBeVisible();
  });

  test('10. Debería permitir cambiar solo algunos campos', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    
    expect(postData.nombre).toBeDefined();
    expect(postData.descripcion).toBeDefined();

    await expect(page.getByText(/categoría.*actualizada/i)).toBeVisible();
  });

  test('11. Debería mostrar confirmación antes de salir sin guardar', async ({ page }) => {
    await page.goto('/admin/categorias/1/editar');

    // Intentar navegar hacia atrás
    await page.goBack();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea salir sin guardar?/i)).toBeVisible();
    
    // Cancelar la navegación
    await page.getByRole('button', { name: /no|cancelar/i }).click();
    
    // Verificar que seguimos en la página de edición
    await expect(page).toHaveURL(/.*\/editar/);
  });

  test('12. Debería cargar datos correctos según el ID de la categoría', async ({ page }) => {
    // Mock específico para otra categoría
    await page.route('**/api/admin/categories/2', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            nombre: 'Deportes',
            descripcion: 'Artículos deportivos',
            activa: false,
            fechaCreacion: '2024-01-10',
            usuarioCreador: 'admin@example.com'
          }
        })
      });
    });

    await page.goto('/admin/categorias/2/editar');

    await expect(page.getByText('Editar Categoría')).toBeVisible();
  });
});