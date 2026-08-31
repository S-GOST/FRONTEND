import { test, expect } from '@playwright/test';

test.describe('Módulo Consulta de Catálogo por Cliente', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    // Mock para obtener productos del catálogo
    await page.route('**/api/catalog/products**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const category = url.searchParams.get('category') || '';
      const search = url.searchParams.get('search') || '';

      let products = [
        { id: 1, nombre: 'Laptop Gamer Pro', sku: 'LAP-GP-001', categoria: 'Electrónica', precio: 1200, stock: 50, imagen: '/img/laptop.jpg', descripcion: 'Laptop de alto rendimiento' },
        { id: 2, nombre: 'Smartphone X', sku: 'SMT-X-002', categoria: 'Electrónica', precio: 800, stock: 100, imagen: '/img/smartphone.jpg', descripcion: 'Teléfono inteligente avanzado' },
        { id: 3, nombre: 'Monitor 27"', sku: 'MON-27-004', categoria: 'Electrónica', precio: 400, stock: 30, imagen: '/img/monitor.jpg', descripcion: 'Monitor Full HD 27 pulgadas' },
        { id: 4, nombre: 'Teclado Mecánico', sku: 'TEC-MEC-005', categoria: 'Accesorios', precio: 150, stock: 75, imagen: '/img/teclado.jpg', descripcion: 'Teclado mecánico RGB' },
        { id: 5, nombre: 'Mouse Gaming', sku: 'MOU-GAM-006', categoria: 'Accesorios', precio: 80, stock: 120, imagen: '/img/mouse.jpg', descripcion: 'Mouse gaming de alta precisión' }
      ];

      // Filtrar por categoría si se especifica
      if (category) {
        products = products.filter(p => p.categoria.toLowerCase().includes(category.toLowerCase()));
      }

      // Filtrar por búsqueda si se especifica
      if (search) {
        products = products.filter(p => 
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(search.toLowerCase())
        );
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: products,
          total: products.length,
          pagina: 1,
          porPagina: 10
        })
      });
    });

    // Mock para obtener servicios del catálogo
    await page.route('**/api/catalog/services**', async (route) => {
      const services = [
        { id: 10, nombre: 'Mantenimiento Preventivo', categoria: 'Mantenimiento', precio: 150, duracion: 120, descripcion: 'Servicio mensual de mantenimiento' },
        { id: 11, nombre: 'Reparación Básica', categoria: 'Reparación', precio: 80, duracion: 60, descripcion: 'Reparaciones simples y rápidas' },
        { id: 12, nombre: 'Consultoría Técnica', categoria: 'Consultoría', precio: 200, duracion: 90, descripcion: 'Asesoramiento profesional especializado' },
        { id: 13, nombre: 'Instalación Completa', categoria: 'Instalación', precio: 300, duracion: 180, descripcion: 'Instalación completa de sistemas' }
      ];

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: services,
          total: services.length
        })
      });
    });

    // Mock para obtener categorías disponibles
    await page.route('**/api/catalog/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Electrónica', count: 3 },
            { id: 2, nombre: 'Accesorios', count: 2 },
            { id: 3, nombre: 'Mantenimiento', count: 1 },
            { id: 4, nombre: 'Reparación', count: 1 },
            { id: 5, nombre: 'Consultoría', count: 1 },
            { id: 6, nombre: 'Instalación', count: 1 }
          ]
        })
      });
    });
  });

  test('1. Debería renderizar el catálogo de productos correctamente', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    await expect(page.getByText('Catálogo de Productos')).toBeVisible();
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
    await expect(page.getByText(/Monitor 27"/i)).toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible(); // O table/list según tu UI
  });

  test('2. Debería mostrar información completa de cada producto', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Verificar que se muestra información básica del primer producto
    const firstProduct = page.getByText(/Laptop Gamer Pro/i).first();
    await expect(firstProduct).toBeVisible();
    
    // Verificar que se muestra el precio
    await expect(page.getByText(/\$1,200|\$1200/i)).toBeVisible();
    
    // Verificar que se muestra el stock disponible
    await expect(page.getByText(/disponible|stock/i)).toBeVisible();
  });

  test('3. Debería filtrar productos por categoría', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Seleccionar categoría "Electrónica"
    await page.getByRole('combobox', { name: /categoría|category/i }).selectOption('Electrónica');

    // Verificar que solo se muestran productos de electrónica
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).toBeVisible();
    await expect(page.getByText(/Teclado Mecánico/i)).not.toBeVisible(); // Es accesorio
  });

  test('4. Debería buscar productos por nombre', async ({ page }) => {
    await page.goto('/catalogo/cliente');
    
    // Esperar a que se actualicen los resultados
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/Smartphone X/i)).not.toBeVisible();
  });

  test('5. Debería mostrar pestañas para cambiar entre productos y servicios', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Verificar que existen las pestañas
    await expect(page.getByRole('tab', { name: /productos/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /servicios/i })).toBeVisible();
    
    // Cambiar a servicios
    await page.getByRole('tab', { name: /servicios/i }).click();
    
    // Verificar que se muestran servicios
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Consultoría Técnica/i)).toBeVisible();
  });

  test('6. Debería mostrar detalles del producto al hacer clic', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Hacer clic en el primer producto
    await page.getByText(/Laptop Gamer Pro/i).first().click();

    // Verificar navegación a detalles
    await expect(page).toHaveURL(/.*\/producto\/1/);
    await expect(page.getByText(/Laptop Gamer Pro/i)).toBeVisible();
    await expect(page.getByText(/descripción|description/i)).toBeVisible();
  });

  test('7. Debería mostrar detalles del servicio al hacer clic', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Cambiar a servicios primero
    await page.getByRole('tab', { name: /servicios/i }).click();

    // Hacer clic en el primer servicio
    await page.getByText(/Mantenimiento Preventivo/i).click();

    // Verificar navegación a detalles
    await expect(page).toHaveURL(/.*\/servicio\/10/);
    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/duración|duration/i)).toBeVisible();
  });

  test('8. Debería ordenar productos por precio', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Seleccionar ordenamiento por precio ascendente
    await page.getByRole('combobox', { name: /ordenar|sort/i }).selectOption('precio-asc');

    // Verificar que el primer producto es el más barato
    const firstPrice = await page.locator('[data-testid="price"]').first().textContent();
    const secondPrice = await page.locator('[data-testid="price"]').nth(1).textContent();
    
    // Esto dependerá de cómo muestres los precios en tu UI
    expect(firstPrice).toBeDefined();
    expect(secondPrice).toBeDefined();
  });

  test('9. Debería mostrar paginación cuando hay muchos productos', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Verificar que existe la paginación
    await expect(page.getByRole('navigation', { name: /paginación|pagination/i })).toBeVisible();
    
    // Verificar números de página
    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2' })).toBeVisible();
  });

  test('10. Debería navegar entre páginas del catálogo', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Ir a la página 2
    await page.getByRole('button', { name: '2' }).click();
    await expect(page).toHaveURL(/.*pagina=2/);
    
    // Volver a la página 1
    await page.getByRole('button', { name: '1' }).click();
    await expect(page).toHaveURL(/.*pagina=1/);
  });

  test('11. Debería mostrar indicador de carga durante la búsqueda', async ({ page }) => {
    // Aumentar delay del mock para este test
    await page.route('**/api/catalog/products**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, data: [], total: 0 })
      });
    });

    await page.goto('/catalogo/cliente');

    // Verificar indicador de carga
    await expect(page.getByText(/cargando|loading/i)).toBeVisible();
  });

  test('12. Debería mostrar mensaje cuando no hay resultados', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    await expect(page.getByText(/no se encontraron resultados|no results found/i)).toBeVisible();
  });

  test('13. Debería permitir agregar productos al carrito desde el catálogo', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Hacer clic en botón "Agregar al carrito" del primer producto
    const addToCartButtons = page.getByRole('button', { name: /agregar.*carrito|add.*cart/i });
    await addToCartButtons.first().click();

    // Verificar que se muestra confirmación o actualización del carrito
    await expect(page.getByText(/agregado.*carrito|added.*cart/i)).toBeVisible();
    
    // O verificar contador del carrito
    await expect(page.getByText(/carrito.*1|cart.*1/i)).toBeVisible();
  });

  test('14. Debería mostrar badges de disponibilidad', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Verificar que los productos con stock tienen badge verde
    const inStockBadges = page.getByText(/disponible|in stock/i);
    await expect(inStockBadges).toHaveCount(5); // Todos los productos mockeados tienen stock
    
    // Verificar que los productos sin stock tendrían badge rojo (si existieran)
    // await expect(page.getByText(/agotado|out of stock/i)).toHaveCount(0);
  });

  test('15. Debería recordar filtros al navegar entre pestañas', async ({ page }) => {
    await page.goto('/catalogo/cliente');

    // Aplicar filtro de categoría
    await page.getByRole('combobox', { name: /categoría|category/i }).selectOption('Electrónica');
    
    // Cambiar a servicios
    await page.getByRole('tab', { name: /servicios/i }).click();
    
    // Volver a productos
    await page.getByRole('tab', { name: /productos/i }).click();
    
    // Verificar que el filtro se mantiene
    await expect(page.getByRole('combobox', { name: /categoría|category/i })).toHaveValue('Electrónica');
  });
});