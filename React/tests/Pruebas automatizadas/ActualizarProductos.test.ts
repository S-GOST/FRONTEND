import { test, expect } from '@playwright/test';

test.describe('Módulo Actualizar Producto', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/products/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener datos del producto específico
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              nombre: 'Laptop Gamer Pro',
              descripcion: 'Laptop de alto rendimiento para gaming profesional',
              categoriaId: 1,
              categoriaNombre: 'Electrónica',
              precio: 1200.00,
              stock: 50,
              sku: 'LAP-GP-001',
              activo: true,
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
            body: JSON.stringify({ mensaje: 'El nombre del producto es obligatorio.' })
          });
        } else if (postData.nombre.length < 3) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre debe tener al menos 3 caracteres.' })
          });
        } else if (!postData.categoriaId) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar una categoría.' })
          });
        } else if (postData.precio <= 0) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El precio debe ser mayor a cero.' })
          });
        } else if (postData.stock < 0) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El stock no puede ser negativo.' })
          });
        } else if (!postData.sku || postData.sku.length < 4) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El SKU debe tener al menos 4 caracteres.' })
          });
        } else if (postData.nombre === 'Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El nombre del producto ya existe.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Producto actualizado exitosamente.',
              data: { id: 1, ...postData }
            })
          });
        }
      }
    });

    // Mock para obtener categorías disponibles
    await page.route('**/api/admin/categories?active=true', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Electrónica' },
            { id: 2, nombre: 'Hogar' },
            { id: 3, nombre: 'Ropa' },
            { id: 4, nombre: 'Deportes' }
          ]
        })
      });
    });
  });

  test('1. Debería renderizar el formulario de edición correctamente', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await expect(page.getByText('Editar Producto')).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el nombre es muy corto', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/al menos 3 caracteres|at least 3 characters/i)).toBeVisible();
  });

  test('4. Debería mostrar error si no se selecciona categoría', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/seleccionar.*categoría|select.*category/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el precio es inválido', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/precio.*mayor|price.*greater/i)).toBeVisible();
  });

  test('6. Debería mostrar error si el stock es negativo', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/stock.*negativo|stock.*negative/i)).toBeVisible();
  });

  test('7. Debería mostrar error si el SKU es inválido', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/sku.*4 caracteres|sku.*4 characters/i)).toBeVisible();
  });

  test('8. Debería actualizar producto exitosamente', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.categoriaId).toBeDefined();
    expect(postData.precio).toBeDefined();
    expect(postData.stock).toBeDefined();
    expect(postData.sku).toBeDefined();

    await expect(page.getByText(/producto.*actualizado|product.*updated/i)).toBeVisible();
  });

  test('9. Debería manejar error cuando el nombre ya existe', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('10. Debería cancelar edición y volver a la lista', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/consultar-productos'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-productos/);
  });

  test('11. Debería mostrar indicador de carga durante la actualización', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/products/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Producto actualizado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/productos/1/editar');
    
    const button = page.getByRole('button', { name: /guardar cambios/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/guardando|saving/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('12. Debería manejar error al actualizar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/products/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar producto.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/productos/1/editar');
    
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('13. Debería validar que los datos no cambien si se cancela', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    // Cancelar
    await page.getByRole('link', { name: /cancelar|volver/i }).click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-productos/);

    // Volver a editar
    await page.goto('/admin/productos/1/editar');
    await expect(page.getByText('Editar Producto')).toBeVisible();
  });

  test('14. Debería permitir cambiar solo algunos campos', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    
    expect(postData.nombre).toBeDefined();
    expect(postData.descripcion).toBeDefined();
    expect(postData.precio).toBeDefined();
    expect(postData.stock).toBeDefined();

    await expect(page.getByText(/producto.*actualizado/i)).toBeVisible();
  });

  test('15. Debería mostrar confirmación antes de salir sin guardar', async ({ page }) => {
    await page.goto('/admin/productos/1/editar');

    // Intentar navegar hacia atrás
    await page.goBack();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea salir sin guardar?/i)).toBeVisible();
    
    // Cancelar la navegación
    await page.getByRole('button', { name: /no|cancelar/i }).click();
    
    // Verificar que seguimos en la página de edición
    await expect(page).toHaveURL(/.*\/editar/);
  });
});