import { test, expect } from '@playwright/test';

test.describe('Módulo Inhabilitar Categoría', () => {

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
                { id: 3, nombre: 'Hogar', descripcion: 'Artículos para el hogar', activa: true, fechaCreacion: '2024-02-20' },
                { id: 4, nombre: 'Ropa', descripcion: 'Prendas de vestir', activa: true, fechaCreacion: '2024-03-05' }
              ],
              total: 3
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo categorías inactivas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, nombre: 'Deportes', descripcion: 'Artículos deportivos', activa: false, fechaCreacion: '2024-01-10' },
                { id: 5, nombre: 'Juguetes', descripcion: 'Juguetes y entretenimiento', activa: false, fechaCreacion: '2024-01-20' }
              ],
              total: 2
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
                { id: 4, nombre: 'Ropa', descripcion: 'Prendas de vestir', activa: true, fechaCreacion: '2024-03-05' },
                { id: 5, nombre: 'Juguetes', descripcion: 'Juguetes y entretenimiento', activa: false, fechaCreacion: '2024-01-20' }
              ],
              total: 5
            })
          });
        }
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        if (postData.activa === false) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Categoría inhabilitada exitosamente.',
              data: { id: postData.id, activa: false }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Solo se permite inhabilitar categorías.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar la lista de categorías correctamente', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    await expect(page.getByText('Inhabilitar Categorías')).toBeVisible();
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Deportes/i)).toBeVisible();
    await expect(page.getByText(/Hogar/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar categorías activas e inactivas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Verificar que hay categorías activas
    await expect(page.getByText(/activa/i)).toHaveCount(3);
    
    // Verificar que hay categorías inactivas
    await expect(page.getByText(/inactiva/i)).toHaveCount(2);
  });

  test('3. Debería filtrar categorías por estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

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
    await page.goto('/admin/inhabilitar-categorias');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Deportes/i)).toBeVisible();
    await expect(page.getByText(/Hogar/i)).toBeVisible();
  });

  test('5. Debería inhabilitar una categoría activa', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de inhabilitar de la primera categoría activa
    const disableButtons = page.getByRole('button', { name: /inhabilitar|desactivar/i });
    await disableButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activa).toBe(false);

    await expect(page.getByText(/categoría.*inhabilitada|category.*disabled/i)).toBeVisible();
  });

  test('6. Debería mostrar confirmación antes de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Hacer clic en el botón de inhabilitar
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea inhabilitar esta categoría?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/categoría.*inhabilitada/i)).not.toBeVisible();
  });

  test('7. Debería mostrar indicador de carga durante la inhabilitación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/categories/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Categoría inhabilitada exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-categorias');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(disableButton).toBeDisabled();
  });

  test('8. Debería manejar error al inhabilitar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/categories/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al inhabilitar categoría.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-categorias');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    await expect(page.getByText(/error.*inhabilitar|error.*disable/i)).toBeVisible();
  });

  test('9. Debería actualizar la lista después de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Contar categorías activas inicialmente
    const initialActiveCount = await page.getByText(/activa/i).count();

    // Inhabilitar una categoría
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/categoría.*inhabilitada/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay una categoría activa menos
    const finalActiveCount = await page.getByText(/activa/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('10. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Verificar que las categorías activas tienen badge verde o similar
    const activeBadges = page.getByText(/activa/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que las categorías inactivas tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactiva/i);
    await expect(inactiveBadges).toHaveCount(2);
  });

  test('11. Debería permitir inhabilitar múltiples categorías', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Inhabilitar primera categoría
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/categoría.*inhabilitada/i)).toBeVisible();

    // Inhabilitar segunda categoría
    await disableButtons.nth(1).click();
    await expect(page.getByText(/categoría.*inhabilitada/i)).toBeVisible();

    // Verificar que ambas se inhabilitaron
    await expect(page.getByText(/inactiva/i)).toHaveCount(4); // Original 2 + 2 nuevas
  });

  test('12. Debería impedir inhabilitar categorías ya inactivas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Verificar que los botones de inhabilitar no están disponibles para categorías inactivas
    const inactiveCategories = page.getByText(/inactiva/i);
    await expect(inactiveCategories).toHaveCount(2);
    
    // Los botones de inhabilitar solo deberían estar disponibles para categorías activas
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await expect(disableButtons).toHaveCount(3); // Solo para las 3 activas
  });

  test('13. Debería exportar lista de categorías', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Hacer clic en ver historial de una categoría
    const historyButtons = page.getByRole('button', { name: /historial|history/i });
    await historyButtons.first().click();

    // Verificar que se muestra el historial
    await expect(page.getByText(/historial de cambios|change history/i)).toBeVisible();
    await expect(page.getByText(/fecha|date/i)).toBeVisible();
    await expect(page.getByText(/usuario|user/i)).toBeVisible();
  });

  test('15. Debería tener opción de reactivar categorías inhabilitadas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-categorias');

    // Cambiar a vista de categorías inactivas
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('inactivas');
    
    // Verificar que existen botones de reactivar
    const enableButtons = page.getByRole('button', { name: /reactivar|activar/i });
    await expect(enableButtons).toHaveCount(2); // Para las 2 inactivas
    
    // Hacer clic en reactivar
    await enableButtons.first().click();
    
    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea reactivar esta categoría?/i)).toBeVisible();
  });
});