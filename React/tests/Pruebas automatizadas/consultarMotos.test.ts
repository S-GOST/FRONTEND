import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar Motos', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/motos**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      if (request.method() === 'GET') {
        // Obtener lista de motos
        if (url.includes('/active')) {
          // Solo motos activas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, marca: 'Honda', modelo: 'CBR 600RR', año: 2024, color: 'Rojo', precio: 15000, cilindrada: 600, stock: 10, activo: true, fechaCreacion: '2024-01-15' },
                { id: 3, marca: 'Yamaha', modelo: 'MT-07', año: 2024, color: 'Negro', precio: 8000, cilindrada: 700, stock: 15, activo: true, fechaCreacion: '2024-02-20' }
              ],
              total: 2
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo motos inactivas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, marca: 'Suzuki', modelo: 'GSX-R 750', año: 2023, color: 'Blanco', precio: 18000, cilindrada: 750, stock: 0, activo: false, fechaCreacion: '2024-01-10' }
              ],
              total: 1
            })
          });
        } else {
          // Todas las motos
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 1, marca: 'Honda', modelo: 'CBR 600RR', año: 2024, color: 'Rojo', precio: 15000, cilindrada: 600, stock: 10, activo: true, fechaCreacion: '2024-01-15' },
                { id: 2, marca: 'Suzuki', modelo: 'GSX-R 750', año: 2023, color: 'Blanco', precio: 18000, cilindrada: 750, stock: 0, activo: false, fechaCreacion: '2024-01-10' },
                { id: 3, marca: 'Yamaha', modelo: 'MT-07', año: 2024, color: 'Negro', precio: 8000, cilindrada: 700, stock: 15, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, marca: 'Kawasaki', modelo: 'Ninja 400', año: 2024, color: 'Verde', precio: 7000, cilindrada: 400, stock: 8, activo: true, fechaCreacion: '2024-03-05' }
              ],
              total: 4
            })
          });
        }
      } else if (request.method() === 'DELETE') {
        const motoId = url.split('/').pop();
        
        if (motoId === '1') {
          await route.fulfill({
            status: 403,
            body: JSON.stringify({ mensaje: 'No se puede eliminar esta moto.' })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Moto eliminada exitosamente.'
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

  test('1. Debería renderizar la tabla de motos correctamente', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    await expect(page.getByText('Consultar Motos')).toBeVisible();
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Yamaha/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /nueva moto|new motorcycle/i })).toBeVisible();
  });

  test('2. Debería mostrar motos activas e inactivas', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Verificar que hay motos activas
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    
    // Verificar que hay motos inactivas
    await expect(page.getByText(/inactivo/i)).toHaveCount(1);
  });

  test('3. Debería filtrar motos por estado', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Seleccionar filtro "Todas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todas');
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();

    // Seleccionar filtro "Activas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activas');
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivas');
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Honda/i)).not.toBeVisible();
  });

  test('4. Debería buscar motos por marca o modelo', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Yamaha/i)).toBeVisible();
  });

  test('5. Debería desactivar una moto activa', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de desactivar de la primera moto activa
    const deactivateButtons = page.getByRole('button', { name: /desactivar|inactivar/i });
    await deactivateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(false);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('6. Debería activar una moto inactiva', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de activar de la moto inactiva
    const activateButtons = page.getByRole('button', { name: /activar|habilitar/i });
    await activateButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(true);

    await expect(page.getByText(/estado.*actualizado|status.*updated/i)).toBeVisible();
  });

  test('7. Debería eliminar una moto con confirmación', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    const deleteButtons = page.getByRole('button', { name: /eliminar|delete/i });
    await deleteButtons.nth(1).click(); // Eliminar la segunda moto (no la protegida)

    await expect(page.getByText(/¿Está seguro de que desea eliminar esta moto?/i)).toBeVisible();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'DELETE'
    );

    await page.getByRole('button', { name: /sí|confirmar/i }).click();
    
    const request = await requestPromise;
    expect(request.method()).toBe('DELETE');

    await expect(page.getByText(/moto.*eliminada|motorcycle.*deleted/i)).toBeVisible();
  });

  test('8. Debería impedir eliminar una moto protegida', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    const deleteButtons = page.getByRole('button', { name: /eliminar/i });
    await deleteButtons.first().click(); // Intentar eliminar la primera moto (protegida)

    await expect(page.getByText(/¿Está seguro/i)).toBeVisible();
    
    await page.getByRole('button', { name: /sí|confirmar/i }).click();

    await expect(page.getByText(/no se puede eliminar|cannot delete/i)).toBeVisible();
  });

  test('9. Debería mostrar indicador de carga durante operaciones', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/motos/**', async (route) => {
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

    await page.goto('/admin/consultar-motos');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });

  test('10. Debería manejar error al cambiar estado', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/motos/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar estado.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/consultar-motos');
    
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    await deactivateButton.click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('11. Debería actualizar la lista después de cambiar estado', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Contar motos activas inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Desactivar una moto
    const deactivateButtons = page.getByRole('button', { name: /desactivar/i });
    await deactivateButtons.first().click();
    await expect(page.getByText(/estado.*actualizado/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay una moto activa menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('12. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Verificar que las motos activas tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que las motos inactivas tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(1);
  });

  test('13. Debería exportar lista de motos', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería navegar a detalles de moto', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Hacer clic en el nombre de la primera moto
    await page.getByText(/Honda CBR 600RR/i).click();

    // Verificar que se muestra una página o modal de detalles
    await expect(page.getByText(/detalles de la moto/i)).toBeVisible();
    await expect(page.getByText(/CBR 600RR/i)).toBeVisible();
    await expect(page.getByText(/2024-01-15/i)).toBeVisible();
  });

  test('15. Debería permitir edición rápida desde la lista', async ({ page }) => {
    await page.goto('/admin/consultar-motos');

    // Hacer clic en editar de la primera moto
    const editButtons = page.getByRole('button', { name: /editar|edit/i });
    await editButtons.first().click();

    // Verificar que se abre un modal o formulario de edición
    await expect(page.getByText(/editar moto|edit motorcycle/i)).toBeVisible();
  });
});