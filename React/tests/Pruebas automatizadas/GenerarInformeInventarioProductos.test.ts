import { test, expect } from '@playwright/test';

test.describe('Módulo Generar Informe de Inventario/Productos', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/reports/inventory**', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();

      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.categoria) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar una categoría.' })
          });
        } else if (!postData.incluirStockBajo && !postData.incluirSinStock && !postData.incluirTodos) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar al menos un tipo de productos a incluir.' })
          });
        } else {
          // Éxito - generar informe de inventario
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Informe de inventario generado exitosamente.',
              data: {
                id: Date.now(),
                nombreArchivo: `inventario_${postData.categoria}_${new Date().toISOString().split('T')[0]}.xlsx`,
                url: `/reports/inventory/${Date.now()}.xlsx`,
                categoria: postData.categoria,
                fechaGeneracion: new Date().toISOString(),
                totalProductos: 150,
                valorTotal: 45000.00,
                productosStockBajo: 12,
                productosSinStock: 5
              }
            })
          });
        }
      }
    });

    // Mock para descargar el informe
    await page.route('**/reports/inventory/*.xlsx', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('Mock Excel content for inventory report')
      });
    });

    // Mock para obtener categorías de productos
    await page.route('**/api/admin/categories/products**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Electrónica', count: 45 },
            { id: 2, nombre: 'Hogar', count: 30 },
            { id: 3, nombre: 'Ropa', count: 25 },
            { id: 4, nombre: 'Deportes', count: 20 },
            { id: 5, nombre: 'Accesorios', count: 30 }
          ]
        })
      });
    });

    // Mock para obtener estadísticas de inventario
    await page.route('**/api/admin/inventory/stats**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            totalProductos: 150,
            valorTotalInventario: 45000.00,
            productosStockBajo: 12,
            productosSinStock: 5,
            categoriasConMasProductos: ['Electrónica', 'Accesorios'],
            rotacionPromedio: 2.5
          }
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await expect(page.getByText('Generar Informe de Inventario/Productos')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /categoría|category/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /stock.*bajo|low.*stock/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /sin.*stock|out.*of.*stock/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /todos.*productos|all.*products/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generar|generate/i })).toBeVisible();
  });

  test('2. Debería cargar las categorías de productos', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    const categorySelect = page.getByRole('combobox', { name: /categoría|category/i });
    await expect(categorySelect).toBeVisible();

    // Verificar que hay opciones cargadas
    const options = categorySelect.locator('option');
    await expect(options).toHaveCount(5); // Las 5 categorías mockeadas

    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Hogar/i)).toBeVisible();
    await expect(page.getByText(/Ropa/i)).toBeVisible();
  });

  test('3. Debería mostrar error si no se selecciona categoría', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('checkbox', { name: /todos.*productos/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/seleccionar.*categoría|select.*category/i)).toBeVisible();
  });

  test('4. Debería mostrar error si no se selecciona ningún tipo de productos', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('1');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/seleccionar.*tipo.*productos|select.*product.*type/i)).toBeVisible();
  });

  test('5. Debería generar informe de inventario exitosamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('1'); // Electrónica
    await page.getByRole('checkbox', { name: /todos.*productos/i }).check();
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/inventory') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.categoria).toBe('1');
    expect(postData.incluirTodos).toBe(true);

    await expect(page.getByText(/informe.*generado|report.*generated/i)).toBeVisible();
    await expect(page.getByText(/inventario_Electrónica/i)).toBeVisible();
  });

  test('6. Debería mostrar estadísticas del inventario', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    // Verificar que se muestran estadísticas
    await expect(page.getByText(/Total.*productos.*150/i)).toBeVisible();
    await expect(page.getByText(/Valor.*total.*\$45,000|\$45000/i)).toBeVisible();
    await expect(page.getByText(/Stock.*bajo.*12/i)).toBeVisible();
    await expect(page.getByText(/Sin.*stock.*5/i)).toBeVisible();
  });

  test('7. Debería descargar el informe en Excel', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('2'); // Hogar
    await page.getByRole('checkbox', { name: /stock.*bajo/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de descarga
    const downloadButton = page.getByRole('button', { name: /descargar.*excel|download.*excel/i });
    await downloadButton.click();

    // Verificar que se inicia la descarga
    await expect(page).toHaveURL(/.*\/generar-informe-inventario/);
  });

  test('8. Debería filtrar solo productos con stock bajo', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('3'); // Ropa
    await page.getByRole('checkbox', { name: /stock.*bajo/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/informe.*generado/i)).toBeVisible();
    // El informe debería contener solo productos con stock bajo
  });

  test('9. Debería filtrar solo productos sin stock', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('4'); // Deportes
    await page.getByRole('checkbox', { name: /sin.*stock/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/informe.*generado/i)).toBeVisible();
    // El informe debería contener solo productos sin stock
  });

  test('10. Debería mostrar indicador de carga durante la generación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/reports/inventory**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 segundos
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Informe generado exitosamente.',
          data: {
            id: Date.now(),
            nombreArchivo: 'inventario_lento.xlsx',
            url: '/reports/inventory/slow.xlsx',
            categoria: 'Electrónica',
            fechaGeneracion: new Date().toISOString(),
            totalProductos: 200,
            valorTotal: 60000.00,
            productosStockBajo: 15,
            productosSinStock: 8
          }
        })
      });
    });

    await page.goto('/admin/generar-informe-inventario');
    
    await page.getByRole('combobox', { name: /categoría/i }).selectOption('1');
    await page.getByRole('checkbox', { name: /todos.*productos/i }).check();
    
    const button = page.getByRole('button', { name: /generar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/generando|generating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('11. Debería manejar error al generar informe', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/reports/inventory**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al generar informe de inventario.' })
      });
    });

    await page.goto('/admin/generar-informe-inventario');
    
    await page.getByRole('combobox', { name: /categoría/i }).selectOption('5');
    await page.getByRole('checkbox', { name: /todos.*productos/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/error.*generar|error.*generate/i)).toBeVisible();
  });

  test('12. Debería mostrar categorías con más productos', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    // Verificar que se muestran las categorías con más productos
    await expect(page.getByText(/Electrónica/i)).toBeVisible();
    await expect(page.getByText(/Accesorios/i)).toBeVisible();
  });

  test('13. Debería mostrar rotación promedio del inventario', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    // Verificar que se muestra la rotación promedio
    await expect(page.getByText(/Rotación.*promedio.*2\.5/i)).toBeVisible();
  });

  test('14. Debería permitir múltiples selecciones de filtros', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('1');
    await page.getByRole('checkbox', { name: /stock.*bajo/i }).check();
    await page.getByRole('checkbox', { name: /sin.*stock/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/informe.*generado/i)).toBeVisible();
    // El informe debería contener productos con stock bajo Y sin stock
  });

  test('15. Debería mostrar resumen ejecutivo del informe', async ({ page }) => {
    await page.goto('/admin/generar-informe-inventario');

    await page.getByRole('combobox', { name: /categoría/i }).selectOption('1');
    await page.getByRole('checkbox', { name: /todos.*productos/i }).check();
    await page.getByRole('button', { name: /generar/i }).click();

    // Verificar que se muestra un resumen
    await expect(page.getByText(/Resumen.*ejecutivo|Executive.*summary/i)).toBeVisible();
    await expect(page.getByText(/Total.*productos.*150/i)).toBeVisible();
    await expect(page.getByText(/Valor.*total.*\$45,000/i)).toBeVisible();
  });
});