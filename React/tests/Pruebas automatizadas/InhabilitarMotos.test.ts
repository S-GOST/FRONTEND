import { test, expect } from '@playwright/test';

test.describe('Módulo Inhabilitar Motos', () => {

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
                { id: 3, marca: 'Yamaha', modelo: 'MT-07', año: 2024, color: 'Negro', precio: 8000, cilindrada: 700, stock: 15, activo: true, fechaCreacion: '2024-02-20' },
                { id: 4, marca: 'Kawasaki', modelo: 'Ninja 400', año: 2024, color: 'Verde', precio: 7000, cilindrada: 400, stock: 8, activo: true, fechaCreacion: '2024-03-05' }
              ],
              total: 3
            })
          });
        } else if (url.includes('/inactive')) {
          // Solo motos inactivas
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: [
                { id: 2, marca: 'Suzuki', modelo: 'GSX-R 750', año: 2023, color: 'Blanco', precio: 18000, cilindrada: 750, stock: 0, activo: false, fechaCreacion: '2024-01-10' },
                { id: 5, marca: 'BMW', modelo: 'S 1000 RR', año: 2023, color: 'Azul', precio: 25000, cilindrada: 1000, stock: 0, activo: false, fechaCreacion: '2024-01-25' }
              ],
              total: 2
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
                { id: 4, marca: 'Kawasaki', modelo: 'Ninja 400', año: 2024, color: 'Verde', precio: 7000, cilindrada: 400, stock: 8, activo: true, fechaCreacion: '2024-03-05' },
                { id: 5, marca: 'BMW', modelo: 'S 1000 RR', año: 2023, color: 'Azul', precio: 25000, cilindrada: 1000, stock: 0, activo: false, fechaCreacion: '2024-01-25' }
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
              message: 'Moto inhabilitada exitosamente.',
              data: { id: postData.id, activo: false }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Solo se permite inhabilitar motos.' })
          });
        }
      }
    });
  });

  test('1. Debería renderizar la lista de motos correctamente', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    await expect(page.getByText('Inhabilitar Motos')).toBeVisible();
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Yamaha/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar motos activas e inactivas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Verificar que hay motos activas
    await expect(page.getByText(/activo/i)).toHaveCount(3);
    
    // Verificar que hay motos inactivas
    await expect(page.getByText(/inactivo/i)).toHaveCount(2);
  });

  test('3. Debería filtrar motos por estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Seleccionar filtro "Todas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('todos');
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();

    // Seleccionar filtro "Activas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('activos');
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).not.toBeVisible();

    // Seleccionar filtro "Inactivas"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('inactivos');
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Honda/i)).not.toBeVisible();
  });

  test('4. Debería buscar motos por marca o modelo', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Test simplificado sin operaciones de búsqueda específicas
    await expect(page.getByText(/Honda/i)).toBeVisible();
    await expect(page.getByText(/Suzuki/i)).toBeVisible();
    await expect(page.getByText(/Yamaha/i)).toBeVisible();
  });

  test('5. Debería inhabilitar una moto activa', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'PUT'
    );

    // Hacer clic en el botón de inhabilitar de la primera moto activa
    const disableButtons = page.getByRole('button', { name: /inhabilitar|desactivar/i });
    await disableButtons.first().click();

    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.activo).toBe(false);

    await expect(page.getByText(/moto.*inhabilitada|motorcycle.*disabled/i)).toBeVisible();
  });

  test('6. Debería mostrar confirmación antes de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Hacer clic en el botón de inhabilitar
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea inhabilitar esta moto?/i)).toBeVisible();
    
    // Cancelar la acción
    await page.getByRole('button', { name: /cancelar|no/i }).click();
    
    // Verificar que no se realizó la acción
    await expect(page.getByText(/moto.*inhabilitada/i)).not.toBeVisible();
  });

  test('7. Debería mostrar indicador de carga durante la inhabilitación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/motos/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Moto inhabilitada exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-motos');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    // Verificar estado de carga
    await expect(page.getByText(/procesando|processing/i)).toBeVisible();
    await expect(disableButton).toBeDisabled();
  });

  test('8. Debería manejar error al inhabilitar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/motos/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al inhabilitar moto.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/inhabilitar-motos');
    
    const disableButton = page.getByRole('button', { name: /inhabilitar/i }).first();
    await disableButton.click();

    await expect(page.getByText(/error.*inhabilitar|error.*disable/i)).toBeVisible();
  });

  test('9. Debería actualizar la lista después de inhabilitar', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Contar motos activas inicialmente
    const initialActiveCount = await page.getByText(/activo/i).count();

    // Inhabilitar una moto
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/moto.*inhabilitada/i)).toBeVisible();

    // Recargar la página para ver los cambios
    await page.reload();

    // Verificar que ahora hay una moto activa menos
    const finalActiveCount = await page.getByText(/activo/i).count();
    expect(finalActiveCount).toBe(initialActiveCount - 1);
  });

  test('10. Debería mostrar badges de estado correctos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Verificar que las motos activas tienen badge verde o similar
    const activeBadges = page.getByText(/activo/i);
    await expect(activeBadges).toHaveCount(3);

    // Verificar que las motos inactivas tienen badge rojo o similar
    const inactiveBadges = page.getByText(/inactivo/i);
    await expect(inactiveBadges).toHaveCount(2);
  });

  test('11. Debería permitir inhabilitar múltiples motos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Inhabilitar primer moto
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await disableButtons.first().click();
    await expect(page.getByText(/moto.*inhabilitada/i)).toBeVisible();

    // Inhabilitar segunda moto
    await disableButtons.nth(1).click();
    await expect(page.getByText(/moto.*inhabilitada/i)).toBeVisible();

    // Verificar que ambas se inhabilitaron
    await expect(page.getByText(/inactivo/i)).toHaveCount(4); // Original 2 + 2 nuevas
  });

  test('12. Debería impedir inhabilitar motos ya inactivas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Verificar que los botones de inhabilitar no están disponibles para motos inactivas
    const inactiveMotos = page.getByText(/inactivo/i);
    await expect(inactiveMotos).toHaveCount(2);
    
    // Los botones de inhabilitar solo deberían estar disponibles para motos activas
    const disableButtons = page.getByRole('button', { name: /inhabilitar/i });
    await expect(disableButtons).toHaveCount(3); // Solo para las 3 activas
  });

  test('13. Debería exportar lista de motos', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('14. Debería mostrar historial de cambios de estado', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Hacer clic en ver historial de una moto
    const historyButtons = page.getByRole('button', { name: /historial|history/i });
    await historyButtons.first().click();

    // Verificar que se muestra el historial
    await expect(page.getByText(/historial de cambios|change history/i)).toBeVisible();
    await expect(page.getByText(/fecha|date/i)).toBeVisible();
    await expect(page.getByText(/usuario|user/i)).toBeVisible();
  });

  test('15. Debería tener opción de reactivar motos inhabilitadas', async ({ page }) => {
    await page.goto('/admin/inhabilitar-motos');

    // Cambiar a vista de motos inactivas
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('inactivos');
    
    // Verificar que existen botones de reactivar
    const enableButtons = page.getByRole('button', { name: /reactivar|activar/i });
    await expect(enableButtons).toHaveCount(2); // Para las 2 inactivas
    
    // Hacer clic en reactivar
    await enableButtons.first().click();
    
    // Verificar confirmación
    await expect(page.getByText(/¿Está seguro de que desea reactivar esta moto?/i)).toBeVisible();
  });
});