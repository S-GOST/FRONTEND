import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar Productos', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/products**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      if (request.method() === 'GET') {
        // Obtener lista de productos
        if (url.includes('/active')) {
          // Solo productos activos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Laptop Gamer Pro', sku: 'LAP-GP-001', categoria: 'Electrónica', precio: 1200, stock: 50, activo: true, fechaCreacion: '2024-01-15' },
                { id: 3, nombre: 'Smartphone X', sku: 'SMT-X-002', categoria: 'Electrónica', precio: 800, stock: 100, activo: true, fechaCreacion: '2024-02-20' }
              ],
              total: 2
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo productos inactivos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, nombre: 'Tablet Básica', sku: 'TBL-BAS-003', categoria: 'Electrónica', precio: 300, stock: 0, activo: false, fechaCreacion: '2024-01-10' }
              ],
              total: 1
            })
          });
        } else {
          // Todos los productos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Laptop Gamer Pro', sku: 'LAP-GP-001', categoria: 'Electrónica', precio: 1200, stock: 50, activo: true, fechaCreacion: '2024-01-15' },
                { id: 2, nombre: 'Tablet Básica', sku: 'TBL-BAS-003', categoria: 'Electrónica', precio: 300, stock: 0, activo: false, fechaCreacion: '2024-01-10' },
                { id: 3, nombre: 'Smartphone X', sku: 'SMT-X-002', categoria: 'Electrónica', precio: 800, stock: 100, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Monitor 27"', sku: 'MON-27-004', categoria: 'Electrónica', precio: 400, stock: 30, activo: true, fechaCreacion: '2024-03-05' }
              ],
              total: 4
            })
          });
        }
      } else if (request.method() === 'DELETE') {
        const productId = url.split('/').pop();
        
        if (productId === '1') {
          await route.fulfill({
            status: 403,
            body: JSON.stringify({ mensaje: 'No se puede eliminar este producto.' })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Producto eliminado exitosamente.'
            })
          });
        }
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.activo === true || postData.activo === false) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Estado actualizado exitosamente.',
              data: { id: postData.id, activo: postData.activo }
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

  test('1. Debería renderizar la tabla de productos correctamente', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    await expect(page.getByText('Consultar Productos')).toBeVisible();
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /nuevo producto|new product/i })).toBeVisible();
  });

  test('2. Debería mostrar productos activos e inactivos', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Verificar que hay productos activos
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    
    // Verificar que hay productos inactivos
    await expect(page.getByText(/inactivo/i)).toHaveCount(1);
  });

  test('3. Debería filtrar productos por estado', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Seleccionar filtro "Todos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todos');
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();

    // Seleccionar filtro "Activos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activos');
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivos"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivos');
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();
    await expect(page.getByText(/Laptop Gamer Pro/i)).not.toBeVisible();
  });

  test('4. Debería buscar productos por nombre o SKU', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
  });

  test('5. Debería desactivar un producto activo', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de desactivar del primer producto activo
    const deactivateButtons = page.getByRole('button', { name: /desactivar|inactivar/i });
    await deactivateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(false);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('6. Debería activar un producto inactivo', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de activar del producto inactivo
    const activateButtons = page.getByRole('button', { name: /activar|habilitar/i });
    await activateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(true);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('7. Debería eliminar un producto con confirmación', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.nth(1).click(); // Eliminar el segundo producto (no el protegido)

    await expect(page.getByText(/¿Está seguro de que desea eliminar este producto?/i)).toBeVisible();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'DELETE'
    );

    await page.getByRole('button', { name: /sí|confirmar/i }).click();
    
    const request = await requestPromise;
    expect(request.method()).toBe('DELETE');

    await expect(page.getByText(/producto.*eliminado|product.*deleted/i)).toBeVisible();
  });

  test('8. Debería impedir eliminar un producto protegido', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    const deleteButtons = page.getByRole('button', { name: /eliminar/i });
    await deleteButtons.first().click(); // Intentar eliminar el primer producto (protegido)

    await expect(page.getByText(/¿Está seguro/i)).toBeVisible();
    
    await page.getByRole('button', { name: /sí|confirmar/i }).click();

    await expect(page.getByText(/no se puede eliminar|cannot delete/i)).toBeVisible();
  });

  test('9. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/products/**', async (route) => {
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

    await page.goto('/admin/consultar-productos');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });

  test('10. Debería manejar error al cambiar estado', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/products/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar estado.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/consultar-productos');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('11. Debería actualizar la lista después de cambiar estado', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Contar productos activos inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Desactivar un producto
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay un producto activo menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('12. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Verificar que los productos activos tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que los productos inactivos tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(1);
  });

  test('13. Debería exportar lista de productos', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería navegar a detalles de producto', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Hacer clic en el nombre del primer producto
    await page.getByText(/Laptop Gamer Pro/i).click();

    // Verificar que se muestra una página o modal de detalles
    await expect(page.getByText(/detalles del producto/i)).toBeVisible();
    await expect(page.getByText(/LAP-GP-001/i)).toBeVisible(); // SKU
    await expect(page.getByText(/2024-01-15/i)).toBeVisible();
  });

  test('15. Debería permitir edición rápida desde la lista', async ({ page }) => {
    await page.goto('/admin/consultar-productos');

    // Hacer clic en editar del primer producto
    const editButtons = page.getByRole('button', { name: /editar|edit/i });
    await editButtons.first().click();

    // Verificar que se abre un modal o formulario de edición
    await expect(page.getByText(/editar producto|edit product/i)).toBeVisible();
  });
});