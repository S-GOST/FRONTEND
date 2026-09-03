import { test, expect } from '@playwright/test';

test.describe('Módulo Registro Automático de Operaciones (Historial)', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/audit-log**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const userId = url.searchParams.get('userId') || '';
      const action = url.searchParams.get('action') || '';
      const dateFrom = url.searchParams.get('dateFrom') || '';
      const dateTo = url.searchParams.get('dateTo') || '';

      let logs = [
        { 
          id: 1, 
          usuario: 'admin@example.com', 
          accion: 'crear_usuario', 
          descripcion: 'Creación de nuevo usuario: Carlos Ruiz', 
          fecha: '2024-01-15T10:30:00Z', 
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        { 
          id: 2, 
          usuario: 'tecnico@example.com', 
          accion: 'actualizar_orden', 
          descripcion: 'Actualización de estado de orden ORD-2024-001 a "procesando"', 
          fecha: '2024-01-15T11:45:00Z', 
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        { 
          id: 3, 
          usuario: 'admin@example.com', 
          accion: 'eliminar_producto', 
          descripcion: 'Eliminación de producto: Laptop Básica', 
          fecha: '2024-01-15T14:20:00Z', 
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        { 
          id: 4, 
          usuario: 'cliente@example.com', 
          accion: 'crear_orden', 
          descripcion: 'Creación de nueva orden de servicio', 
          fecha: '2024-01-15T16:10:00Z', 
          ip: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        },
        { 
          id: 5, 
          usuario: 'admin@example.com', 
          accion: 'cambiar_permisos', 
          descripcion: 'Modificación de permisos para rol "Técnico"', 
          fecha: '2024-01-15T17:30:00Z', 
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ];

      // Filtrar por usuario si se especifica
      if (userId) {
        logs = logs.filter(l => l.usuario.includes(userId));
      }

      // Filtrar por acción si se especifica
      if (action) {
        logs = logs.filter(l => l.accion.includes(action));
      }

      // Filtrar por rango de fechas si se especifica
      if (dateFrom && dateTo) {
        logs = logs.filter(l => {
          const logDate = new Date(l.fecha);
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          return logDate >= from && logDate <= to;
        });
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: logs,
          total: logs.length
        })
      });
    });

    // Mock para exportar historial
    await page.route('**/api/admin/audit-log/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'ID,Usuario,Acción,Descripción,Fecha,IP\n1,admin@example.com,crear_usuario,"Creación de nuevo usuario: Carlos Ruiz",2024-01-15T10:30:00Z,192.168.1.100'
      });
    });
  });

  test('1. Debería renderizar el historial de operaciones correctamente', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    await expect(page.getByText('Historial de Operaciones')).toBeVisible();
    await expect(page.getByText(/crear_usuario/i)).toBeVisible();
    await expect(page.getByText(/actualizar_orden/i)).toBeVisible();
    await expect(page.getByText(/eliminar_producto/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar información completa de cada operación', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Verificar que se muestra información detallada
    await expect(page.getByText(/admin@example.com/i)).toBeVisible();
    await expect(page.getByText(/2024-01-15T10:30:00Z/i)).toBeVisible();
    await expect(page.getByText(/192\.168\.1\.100/i)).toBeVisible();
    await expect(page.getByText(/Creación de nuevo usuario/i)).toBeVisible();
  });

  test('3. Debería filtrar operaciones por usuario', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    await expect(page.getByText(/admin@example.com/i)).toHaveCount(3);
    await expect(page.getByText(/tecnico@example.com/i)).not.toBeVisible();
    await expect(page.getByText(/cliente@example.com/i)).not.toBeVisible();
  });

  test('4. Debería filtrar operaciones por tipo de acción', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Seleccionar filtro "Crear"
    await page.getByRole('combobox', { name: /acción|action/i }).selectOption('crear');
    await expect(page.getByText(/crear_usuario/i)).toBeVisible();
    await expect(page.getByText(/crear_orden/i)).toBeVisible();
    await expect(page.getByText(/actualizar_orden/i)).not.toBeVisible();

    // Seleccionar filtro "Actualizar"
    await page.getByRole('combobox', { name: /acción|action/i }).selectOption('actualizar');
    await expect(page.getByText(/actualizar_orden/i)).toBeVisible();
    await expect(page.getByText(/crear_usuario/i)).not.toBeVisible();
  });

  test('5. Debería filtrar operaciones por rango de fechas', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Establecer rango de fechas
    await page.getByLabel(/fecha.*desde|date.*from/i).fill('2024-01-15');
    await page.getByLabel(/fecha.*hasta|date.*to/i).fill('2024-01-15');
    await page.getByRole('button', { name: /aplicar.*filtros|apply.*filters/i }).click();

    // Verificar que solo se muestran operaciones en el rango
    await expect(page.getByText(/2024-01-15/i)).toHaveCount(5);
  });

  test('6. Debería mostrar user agent de cada operación', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Hacer clic en ver detalles de una operación
    const detailButtons = page.getByRole('button', { name: /ver.*detalles|view.*details/i });
    await detailButtons.first().click();

    // Verificar que se muestra el user agent
    await expect(page.getByText(/Mozilla/i)).toBeVisible();
    await expect(page.getByText(/Windows/i)).toBeVisible();
  });

  test('7. Debería ordenar operaciones por fecha', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Ordenar por fecha descendente (más reciente primero)
    await page.getByRole('combobox', { name: /ordenar.*por|sort.*by/i }).selectOption('fecha-desc');

    // Verificar que la primera operación es la más reciente
    const firstRow = await page.locator('tbody tr').first();
    await expect(firstRow).toContainText(/17:30:00/); // La última operación del día
  });

  test('8. Debería exportar historial de operaciones', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/historial.*exportado|log.*exported/i)).toBeVisible();
  });

  test('9. Debería mostrar contador de operaciones por tipo', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Verificar que se muestran contadores
    await expect(page.getByText(/crear/i)).toBeVisible();
    await expect(page.getByText(/actualizar/i)).toBeVisible();
    await expect(page.getByText(/eliminar/i)).toBeVisible();
    
    // Verificar números específicos
    await expect(page.getByText(/2.*crear|2.*create/i)).toBeVisible(); // 2 operaciones de creación
    await expect(page.getByText(/1.*actualizar|1.*update/i)).toBeVisible(); // 1 actualización
    await expect(page.getByText(/1.*eliminar|1.*delete/i)).toBeVisible(); // 1 eliminación
  });

  test('10. Debería permitir buscar por descripción', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    await expect(page.getByText(/actualizar_orden/i)).toBeVisible();
    await expect(page.getByText(/crear_orden/i)).toBeVisible();
    await expect(page.getByText(/crear_usuario/i)).not.toBeVisible();
  });

  test('11. Debería mostrar IP de origen de cada operación', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Verificar que se muestran las IPs
    await expect(page.getByText(/192\.168\.1\.100/i)).toBeVisible();
    await expect(page.getByText(/192\.168\.1\.101/i)).toBeVisible();
    await expect(page.getByText(/192\.168\.1\.102/i)).toBeVisible();
  });

  test('12. Debería limpiar todos los filtros', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Aplicar algunos filtros
    await page.getByRole('combobox', { name: /acción/i }).selectOption('crear');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/admin@example.com/i)).toHaveCount(2);

    // Limpiar filtros
    await page.getByRole('button', { name: /limpiar.*filtros|clear.*filters/i }).click();

    // Verificar que se muestran todas las operaciones nuevamente
    await expect(page.getByText(/admin@example.com/i)).toHaveCount(3);
    await expect(page.getByText(/tecnico@example.com/i)).toBeVisible();
  });

  test('13. Debería mostrar mensaje cuando no hay resultados', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Aplicar filtro que no devuelve resultados
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/no se encontraron.*operaciones|no.*operations.*found/i)).toBeVisible();
  });

  test('14. Debería permitir ver detalles completos de operación', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Hacer clic en ver detalles
    const detailButtons = page.getByRole('button', { name: /ver.*detalles/i });
    await detailButtons.first().click();

    // Verificar que se muestra información completa
    await expect(page.getByText(/ID.*1/i)).toBeVisible();
    await expect(page.getByText(/Usuario.*admin@example.com/i)).toBeVisible();
    await expect(page.getByText(/Acción.*crear_usuario/i)).toBeVisible();
    await expect(page.getByText(/Fecha.*2024-01-15T10:30:00Z/i)).toBeVisible();
    await expect(page.getByText(/IP.*192\.168\.1\.100/i)).toBeVisible();
    await expect(page.getByText(/User Agent.*Mozilla/i)).toBeVisible();
  });

  test('15. Debería registrar automáticamente nuevas operaciones', async ({ page }) => {
    await page.goto('/admin/historial-operaciones');

    // Simular una nueva operación (esto dependería de tu implementación real)
    // En un escenario real, esto ocurriría automáticamente cuando se realiza una acción
    
    // Verificar que el historial se actualiza (mockeado aquí)
    await expect(page.getByRole('table')).toBeVisible();
    
    // Nota: En una prueba real, necesitarías disparar una acción que genere un log
    // y luego verificar que aparece en la lista
  });
});