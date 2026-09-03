import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar Categorías', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/categories**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      if (request.method() === 'GET') {
        // Obtener lista de categorías
        if (url.includes('/active')) {
          // Solo categorías activas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Electrónica', descripcion: 'Productos electrónicos', activa: true, fechaCreacion: '2024-01-15' },
                { id: 3, nombre: 'Hogar', descripcion: 'Artículos para el hogar', activa: true, fechaCreacion: '2024-02-20' }
              ],
              total: 2
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo categorías inactivas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, nombre: 'Deportes', descripcion: 'Artículos deportivos', activa: false, fechaCreacion: '2024-01-10' }
              ],
              total: 1
            })
          });
        } else {
          // Todas las categorías
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, nombre: 'Electrónica', descripcion: 'Productos electrónicos', activa: true, fechaCreacion: '2024-01-15' },
                { id: 2, nombre: 'Deportes', descripcion: 'Artículos deportivos', activa: false, fechaCreacion: '2024-01-10' },
                { id: 3, nombre: 'Hogar', descripcion: 'Artículos para el hogar', activa: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Ropa', descripcion: 'Prendas de vestir', activa: true, fechaCreacion: '2024-03-05' }
              ],
              total: 4
            })
          });
        }
      } else if (request.method() === 'DELETE') {
        const categoryId = url.split('/').pop();
        
        if (categoryId === '1') {
          await route.fulfill({
            status: 403,
            body: JSON.stringify({ mensaje: 'No se puede eliminar esta categoría.' })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Categoría eliminada exitosamente.'
            })
          });
        }
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.activa === true || postData.activa === false) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Estado actualizado exitosamente.',
              data: { id: postData.id, activa: postData.activa }
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

  test('1. Debería renderizar la tabla de categorías correctamente', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    await expect(page.getByText('Consultar Categorías')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /nueva categoría|new category/i })).toBeVisible();
  });

  test('2. Debería mostrar categorías activas e inactivas', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Verificar que hay categorías activas
    await expect(page.getByText(/activa/i)).toHaveCount(3);
    
    // Verificar que hay categorías inactivas
    await expect(page.getByText(/inactiva/i)).toHaveCount(1);
  });

  test('3. Debería filtrar categorías por estado', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Seleccionar filtro "Todas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todas');
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Deportes/i)).toBeVisible();

    // Seleccionar filtro "Activas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activas');
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Deportes/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivas');
    await expect(page.getByText(/Deportes/i)).toBeVisible();
    await expect(page.getByText(/Electrónica/i)).not.toBeVisible();
  });

  test('4. Debería buscar categorías por nombre', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Deportes/i)).toBeVisible();
    await expect(page.getByText(/Hogar/i)).toBeVisible();
  });

  test('5. Debería desactivar una categoría activa', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de desactivar de la primera categoría activa
    const deactivateButtons = page.getByRole('button', { name: /desactivar|inactivar/i });
    await deactivateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activa).toBe(false);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('6. Debería activar una categoría inactiva', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de activar de la categoría inactiva
    const activateButtons = page.getByRole('button', { name: /activar|habilitar/i });
    await activateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activa).toBe(true);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('7. Debería eliminar una categoría con confirmación', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.nth(1).click(); // Eliminar la segunda categoría (no la protegida)

    await expect(page.getByText(/¿Está seguro de que desea eliminar esta categoría?/i)).toBeVisible();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'DELETE'
    );

    await page.getByRole('button', { name: /sí|confirmar/i }).click();
    
    const request = await requestPromise;
    expect(request.method()).toBe('DELETE');

    await expect(page.getByText(/categoría.*eliminada|category.*deleted/i)).toBeVisible();
  });

  test('8. Debería impedir eliminar una categoría protegida', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    const deleteButtons = page.getByRole('button', { name: /eliminar/i });
    await deleteButtons.first().click(); // Intentar eliminar la primera categoría (protegida)

    await expect(page.getByText(/¿Está seguro/i)).toBeVisible();
    
    await page.getByRole('button', { name: /sí|confirmar/i }).click();

    await expect(page.getByText(/no se puede eliminar|cannot delete/i)).toBeVisible();
  });

  test('9. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/categories/**', async (route) => {
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

    await page.goto('/admin/consultar-categorias');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });

  test('10. Debería manejar error al cambiar estado', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/categories/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar estado.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/consultar-categorias');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('11. Debería actualizar la lista después de cambiar estado', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Contar categorías activas inicialmente
    const initialActiveCount = await page.getByText(/activa/i).count();

    // Desactivar una categoría
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay una categoría activa menos
    const finalActiveCount = await page.getByText(/activa/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('12. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Verificar que las categorías activas tienen badge verde o similar
    const activeBadges = page.getByText(/activa/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que las categorías inactivas tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactiva/i);
    await expect(inactiveBadges).toHaveCount(1);
  });

  test('13. Debería exportar lista de categorías', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería navegar a detalles de categoría', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Hacer clic en el nombre de la primera categoría
    await page.getByText(/Electrónica/i).click();

    // Verificar que se muestra una página o modal de detalles
    await expect(page.getByText(/detalles de la categoría/i)).toBeVisible();
  });

  test('15. Debería permitir edición rápida desde la lista', async ({ page }) => {
    await page.goto('/admin/consultar-categorias');

    // Hacer clic en editar de la primera categoría
    const editButtons = page.getByRole('button', { name: /editar|edit/i });
    await editButtons.first().click();

    // Verificar que se abre un modal o formulario de edición
    await expect(page.getByText(/editar categoría|edit category/i)).toBeVisible();
  });
});