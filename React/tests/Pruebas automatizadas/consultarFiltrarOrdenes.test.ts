import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar/Filtrar Órdenes', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/orders**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const status = url.searchParams.get('status') || '';
      const dateFrom = url.searchParams.get('dateFrom') || '';
      const dateTo = url.searchParams.get('dateTo') || '';
      const customer = url.searchParams.get('customer') || '';
      const minAmount = url.searchParams.get('minAmount') || '';
      const maxAmount = url.searchParams.get('maxAmount') || '';

      let orders = [
        { id: 1, numeroOrden: 'ORD-2024-001', cliente: 'Juan Pérez', email: 'juan@example.com', estado: 'pendiente', fechaCreacion: '2024-01-15', total: 1500.00, items: 3 },
        { id: 2, numeroOrden: 'ORD-2024-002', cliente: 'María García', email: 'maria@example.com', estado: 'procesando', fechaCreacion: '2024-01-16', total: 800.00, items: 2 },
        { id: 3, numeroOrden: 'ORD-2024-003', cliente: 'Carlos López', email: 'carlos@example.com', estado: 'enviado', fechaCreacion: '2024-01-17', total: 2200.00, items: 5 },
        { id: 4, numeroOrden: 'ORD-2024-004', cliente: 'Ana Rodríguez', email: 'ana@example.com', estado: 'entregado', fechaCreacion: '2024-01-18', total: 950.00, items: 1 },
        { id: 5, numeroOrden: 'ORD-2024-005', cliente: 'Luis Martínez', email: 'luis@example.com', estado: 'cancelado', fechaCreacion: '2024-01-19', total: 1200.00, items: 4 },
        { id: 6, numeroOrden: 'ORD-2024-006', cliente: 'Sofía Hernández', email: 'sofia@example.com', estado: 'pendiente', fechaCreacion: '2024-01-20', total: 3500.00, items: 8 }
      ];

      // Filtrar por estado si se especifica
      if (status) {
        orders = orders.filter(o => o.estado === status);
      }

      // Filtrar por rango de fechas si se especifica
      if (dateFrom && dateTo) {
        orders = orders.filter(o => {
          const orderDate = new Date(o.fechaCreacion);
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          return orderDate >= from && orderDate <= to;
        });
      }

      // Filtrar por cliente si se especifica
      if (customer) {
        orders = orders.filter(o => 
          o.cliente.toLowerCase().includes(customer.toLowerCase()) ||
          o.email.toLowerCase().includes(customer.toLowerCase())
        );
      }

      // Filtrar por monto mínimo si se especifica
      if (minAmount) {
        orders = orders.filter(o => o.total >= parseFloat(minAmount));
      }

      // Filtrar por monto máximo si se especifica
      if (maxAmount) {
        orders = orders.filter(o => o.total <= parseFloat(maxAmount));
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: orders,
          total: orders.length,
          pagina: 1,
          porPagina: 10
        })
      });
    });
  });

  test('1. Debería renderizar la tabla de órdenes correctamente', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    await expect(page.getByText('Consultar y Filtrar Órdenes')).toBeVisible();
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar órdenes con diferentes estados', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Verificar que hay órdenes en diferentes estados
    await expect(page.getByText(/pendiente/i)).toHaveCount(2);
    await expect(page.getByText(/procesando/i)).toHaveCount(1);
    await expect(page.getByText(/enviado/i)).toHaveCount(1);
    await expect(page.getByText(/entregado/i)).toHaveCount(1);
    await expect(page.getByText(/cancelado/i)).toHaveCount(1);
  });

  test('3. Debería filtrar órdenes por estado', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Seleccionar filtro "Pendientes"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('pendiente');
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).not.toBeVisible();
    await expect(page.getByText(/pendiente/i)).toHaveCount(2);

    // Seleccionar filtro "Entregados"
    await page.getByRole('combobox', { name: /filtro.*estado|filter.*status/i }).selectOption('entregado');
    await expect(page.getByText(/ORD-2024-004/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-001/i)).not.toBeVisible();
    await expect(page.getByText(/entregado/i)).toHaveCount(1);
  });

  test('4. Debería filtrar órdenes por rango de fechas', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Establecer rango de fechas
    await page.getByLabel(/fecha.*desde|date.*from/i).fill('2024-01-16');
    await page.getByLabel(/fecha.*hasta|date.*to/i).fill('2024-01-18');
    await page.getByRole('button', { name: /aplicar.*filtros|apply.*filters/i }).click();

    // Verificar que solo se muestran órdenes en el rango
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible(); // 2024-01-16
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible(); // 2024-01-17
    await expect(page.getByText(/ORD-2024-004/i)).toBeVisible(); // 2024-01-18
    await expect(page.getByText(/ORD-2024-001/i)).not.toBeVisible(); // 2024-01-15 (fuera del rango)
  });

  test('5. Debería buscar órdenes por nombre de cliente', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    await expect(page.getByText(/María García/i)).toBeVisible();
    await expect(page.getByText(/Juan Pérez/i)).not.toBeVisible();
    await expect(page.getByText(/Carlos López/i)).not.toBeVisible();
  });

  test('6. Debería filtrar órdenes por monto mínimo', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    await page.getByLabel(/monto.*mínimo|min.*amount/i).fill('1000');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que solo se muestran órdenes con monto >= 1000
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible(); // 1500
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible(); // 2200
    await expect(page.getByText(/ORD-2024-005/i)).toBeVisible(); // 1200
    await expect(page.getByText(/ORD-2024-006/i)).toBeVisible(); // 3500
    await expect(page.getByText(/ORD-2024-002/i)).not.toBeVisible(); // 800
    await expect(page.getByText(/ORD-2024-004/i)).not.toBeVisible(); // 950
  });

  test('7. Debería filtrar órdenes por monto máximo', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    await page.getByLabel(/monto.*máximo|max.*amount/i).fill('1000');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que solo se muestran órdenes con monto <= 1000
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible(); // 800
    await expect(page.getByText(/ORD-2024-004/i)).toBeVisible(); // 950
    await expect(page.getByText(/ORD-2024-001/i)).not.toBeVisible(); // 1500
    await expect(page.getByText(/ORD-2024-003/i)).not.toBeVisible(); // 2200
  });

  test('8. Debería aplicar múltiples filtros simultáneamente', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Aplicar múltiples filtros
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('pendiente');
    await page.getByLabel(/monto.*mínimo/i).fill('1000');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que se aplican todos los filtros
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible(); // pendiente y >= 1000
    await expect(page.getByText(/ORD-2024-006/i)).toBeVisible(); // pendiente y >= 1000
    await expect(page.getByText(/ORD-2024-002/i)).not.toBeVisible(); // no es pendiente
    await expect(page.getByText(/ORD-2024-003/i)).not.toBeVisible(); // no es pendiente
  });

  test('9. Debería limpiar todos los filtros', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Aplicar algunos filtros
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('pendiente');
    await page.getByLabel(/monto.*mínimo/i).fill('1000');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).not.toBeVisible();

    // Limpiar filtros
    await page.getByRole('button', { name: /limpiar.*filtros|clear.*filters/i }).click();

    // Verificar que se muestran todas las órdenes nuevamente
    await expect(page.getByText(/ORD-2024-001/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-002/i)).toBeVisible();
    await expect(page.getByText(/ORD-2024-003/i)).toBeVisible();
  });

  test('10. Debería mostrar contador de resultados filtrados', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Verificar contador inicial
    await expect(page.getByText(/6.*órdenes|6.*orders/i)).toBeVisible();

    // Aplicar filtro
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('pendiente');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que el contador se actualiza
    await expect(page.getByText(/2.*órdenes|2.*orders/i)).toBeVisible();
  });

  test('11. Debería mostrar mensaje cuando no hay resultados', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Aplicar filtro que no devuelve resultados
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('pendiente');
    await page.getByLabel(/monto.*mínimo/i).fill('10000'); // Monto muy alto
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/no se encontraron.*órdenes|no.*orders.*found/i)).toBeVisible();
  });

  test('12. Debería ordenar órdenes por fecha', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Ordenar por fecha descendente (más reciente primero)
    await page.getByRole('combobox', { name: /ordenar.*por|sort.*by/i }).selectOption('fecha-desc');

    // Verificar que la primera orden es la más reciente
    const firstOrder = await page.locator('tbody tr').first().textContent();
    expect(firstOrder).toContain('ORD-2024-006'); // 2024-01-20 (más reciente)
  });

  test('13. Debería ordenar órdenes por monto', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Ordenar por monto ascendente (menor primero)
    await page.getByRole('combobox', { name: /ordenar.*por/i }).selectOption('monto-asc');

    // Verificar que la primera orden tiene el menor monto
    const firstOrder = await page.locator('tbody tr').first().textContent();
    expect(firstOrder).toContain('ORD-2024-002'); // 800 (menor monto)
  });

  test('14. Debería exportar lista filtrada de órdenes', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Aplicar filtro
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('pendiente');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/lista.*exportada|list.*exported/i)).toBeVisible();
  });

  test('15. Debería guardar preferencias de filtro', async ({ page }) => {
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Aplicar filtros
    await page.getByRole('combobox', { name: /filtro.*estado/i }).selectOption('procesando');
    await page.getByLabel(/monto.*mínimo/i).fill('500');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Navegar a otra página y volver
    await page.goto('/admin/dashboard');
    await page.goto('/admin/consultar-filtrar-ordenes');

    // Verificar que los filtros se mantienen (depende de implementación)
    // Esto asume que tu aplicación guarda las preferencias en localStorage o similar
    await expect(page.getByRole('combobox', { name: /filtro.*estado/i })).toHaveValue('procesando');
    await expect(page.getByLabel(/monto.*mínimo/i)).toHaveValue('500');
  });
});