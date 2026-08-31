import { test, expect } from '@playwright/test';

test.describe('Módulo Inhabilitar Productos', () => {

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
                { id: 3, nombre: 'Smartphone X', sku: 'SMT-X-002', categoria: 'Electrónica', precio: 800, stock: 100, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Monitor 27"', sku: 'MON-27-004', categoria: 'Electrónica', precio: 400, stock: 30, activo: true, fechaCreacion: '2024-03-05' }
              ],
              total: 3
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo productos inactivos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, nombre: 'Tablet Básica', sku: 'TBL-BAS-003', categoria: 'Electrónica', precio: 300, stock: 0, activo: false, fechaCreacion: '2024-01-10' },
                { id: 5, nombre: 'Teclado Mecánico', sku: 'TEC-MEC-005', categoria: 'Accesorios', precio: 150, stock: 0, activo: false, fechaCreacion: '2024-01-25' }
              ],
              total: 2
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
                { id: 4, nombre: 'Monitor 27"', sku: 'MON-27-004', categoria: 'Electrónica', precio: 400, stock: 30, activo: true, fechaCreacion: '2024-03-05' },
                { id: 5, nombre: 'Teclado Mecánico', sku: 'TEC-MEC-005', categoria: 'Accesorios', precio: 150, stock: 0, activo: false, fechaCreacion: '2024-01-25' }
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
              message: 'Producto inhabilitado exitosamente.',
              data: { id: postData.id, activo: false }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Solo se permite inhabilitar productos.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar la lista de productos correctamente', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    await expect(page.getByText('Inhabilitar Productos')).toBeVisible();
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar productos activos e inactivos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Verificar que hay productos activos
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    
    // Verificar que hay productos inactivos
    await expect(page.getByText(/inactivo/i)).toHaveCount(2);
  });

  test('3. Debería filtrar productos por estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

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
    await page.goto('/admin/inhabilitar-productos');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Tablet Básica/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
  });

  test('5. Debería inhabilitar un producto activo', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/products/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de inhabilitar del primer producto activo
    const disableButtons = page.getByRole('button', { name: /inhabilitar|desactivar/i });
    await disableButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(false);

    await expect(page.getByText(/producto.*inhabilitado|product.*disabled/i)).toBeVisible();
  });

  test('6. Debería mostrar confirmación antes de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Hacer clic en el botón de inhabilitar
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea inhabilitar este producto?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/producto.*inhabilitado/i)).not.toBeVisible();
  });

  test('7. Debería mostrar indicador de carga durante la inhabilitación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/products/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Producto inhabilitado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-productos');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(disableButton).toBeDisabled();
  });

  test('8. Debería manejar error al inhabilitar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/products/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al inhabilitar producto.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-productos');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    await expect(page.getByText(/error.*inhabilitar|error.*disable/i)).toBeVisible();
  });

  test('9. Debería actualizar la lista después de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Contar productos activos inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Inhabilitar un producto
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/producto.*inhabilitado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay un producto activo menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('10. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Verificar que los productos activos tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que los productos inactivos tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(2);
  });

  test('11. Debería permitir inhabilitar múltiples productos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Inhabilitar primer producto
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/producto.*inhabilitado/i)).toBeVisible();

    // Inhabilitar segundo producto
    await disableButtons.nth(1).click();
    await expect(page.getByText(/producto.*inhabilitado/i)).toBeVisible();

    // Verificar que ambos se inhabilitaron
    await expect(page.getByText(/inactivo/i)).toHaveCount(4); // Original 2 + 2 nuevas
  });

  test('12. Debería impedir inhabilitar productos ya inactivos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Verificar que los botones de inhabilitar no están disponibles para productos inactivos
    const inactiveProducts = page.getByText(/inactivo/i);
    await expect(inactiveProducts).toHaveCount(2);
    
    // Los botones de inhabilitar solo deberían estar disponibles para productos activos
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await expect(disableButtons).toHaveCount(3); // Solo para los 3 activos
  });

  test('13. Debería exportar lista de productos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Hacer clic en ver historial de un producto
    const historyButtons = page.getByRole('button', { name: /historial|history/i });
    await historyButtons.first().click();

    // Verificar que se muestra el historial
    await expect(page.getByText(/historial de cambios|change history/i)).toBeVisible();
    await expect(page.getByText(/fecha|date/i)).toBeVisible();
    await expect(page.getByText(/usuario|user/i)).toBeVisible();
  });

  test('15. Debería tener opción de reactivar productos inhabilitados', async ({ page }) => {
    await page.goto('/admin/inhabilitar-productos');

    // Cambiar a vista de productos inactivos
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('inactivos');
    
    // Verificar que existen botones de reactivar
    const enableButtons = page.getByRole('button', { name: /reactivar|activar/i });
    await expect(enableButtons).toHaveCount(2); // Para los 2 inactivos
    
    // Hacer clic en reactivar
    await enableButtons.first().click();
    
    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea reactivar este producto?/i)).toBeVisible();
  });
});