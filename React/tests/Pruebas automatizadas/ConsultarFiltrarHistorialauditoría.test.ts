import { test, expect } from '@playwright/test';

test.describe('Módulo Consultar/Filtrar Historial de Auditoría', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/audit**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const entityType = url.searchParams.get('entityType') || ''; // user, product, order, etc.
      const entityId = url.searchParams.get('entityId') || '';
      const action = url.searchParams.get('action') || '';
      const userId = url.searchParams.get('userId') || '';
      const dateFrom = url.searchParams.get('dateFrom') || '';
      const dateTo = url.searchParams.get('dateTo') || '';
      const severity = url.searchParams.get('severity') || ''; // low, medium, high, critical

      let audits = [
        { 
          id: 1, 
          entidad: 'usuario', 
          entidadId: 1, 
          usuario: 'admin@example.com', 
          accion: 'login', 
          descripcion: 'Inicio de sesión exitoso', 
          fecha: '2024-01-15T08:00:00Z', 
          ip: '192.168.1.100',
          severidad: 'low',
          detalles: { metodo: 'password', exito: true }
        },
        { 
          id: 2, 
          entidad: 'producto', 
          entidadId: 5, 
          usuario: 'admin@example.com', 
          accion: 'update', 
          descripcion: 'Actualización de precio de producto', 
          fecha: '2024-01-15T10:30:00Z', 
          ip: '192.168.1.100',
          severidad: 'medium',
          detalles: { campo: 'precio', valorAnterior: 1000, valorNuevo: 1200 }
        },
        { 
          id: 3, 
          entidad: 'orden', 
          entidadId: 10, 
          usuario: 'sistema', 
          accion: 'create', 
          descripcion: 'Creación automática de orden de servicio', 
          fecha: '2024-01-15T14:20:00Z', 
          ip: '127.0.0.1',
          severidad: 'low',
          detalles: { tipo: 'servicio', automatico: true }
        },
        { 
          id: 4, 
          entidad: 'usuario', 
          entidadId: 3, 
          usuario: 'admin@example.com', 
          accion: 'delete', 
          descripcion: 'Eliminación de usuario inactivo', 
          fecha: '2024-01-15T16:45:00Z', 
          ip: '192.168.1.100',
          severidad: 'high',
          detalles: { motivo: 'inactividad', diasInactivo: 180 }
        },
        { 
          id: 5, 
          entidad: 'sistema', 
          entidadId: null, 
          usuario: 'sistema', 
          accion: 'backup', 
          descripcion: 'Backup automático del sistema', 
          fecha: '2024-01-15T23:00:00Z', 
          ip: '127.0.0.1',
          severidad: 'low',
          detalles: { tamaño: '2.5GB', duracion: '45min' }
        },
        { 
          id: 6, 
          entidad: 'permiso', 
          entidadId: 2, 
          usuario: 'admin@example.com', 
          accion: 'modify', 
          descripcion: 'Modificación de permisos de rol', 
          fecha: '2024-01-16T09:15:00Z', 
          ip: '192.168.1.100',
          severidad: 'critical',
          detalles: { rol: 'tecnico', permisosAgregados: ['delete_orders'], permisosRemovidos: [] }
        }
      ];

      // Filtrar por tipo de entidad si se especifica
      if (entityType) {
        audits = audits.filter(a => a.entidad === entityType);
      }

      // Filtrar por ID de entidad si se especifica
      if (entityId) {
        audits = audits.filter(a => a.entidadId?.toString() === entityId);
      }

      // Filtrar por acción si se especifica
      if (action) {
        audits = audits.filter(a => a.accion.includes(action));
      }

      // Filtrar por usuario si se especifica
      if (userId) {
        audits = audits.filter(a => a.usuario.includes(userId));
      }

      // Filtrar por severidad si se especifica
      if (severity) {
        audits = audits.filter(a => a.severidad === severity);
      }

      // Filtrar por rango de fechas si se especifica
      if (dateFrom && dateTo) {
        audits = audits.filter(a => {
          const auditDate = new Date(a.fecha);
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          return auditDate >= from && auditDate <= to;
        });
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: audits,
          total: audits.length
        })
      });
    });

    // Mock para exportar auditoría
    await page.route('**/api/admin/audit/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'ID,Entidad,EntidadID,Usuario,Acción,Descripción,Fecha,IP,Severidad\n1,usuario,1,admin@example.com,login,"Inicio de sesión exitoso",2024-01-15T08:00:00Z,192.168.1.100,low'
      });
    });
  });

  test('1. Debería renderizar el historial de auditoría correctamente', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    await expect(page.getByText('Historial de Auditoría')).toBeVisible();
    await expect(page.getByText(/login/i)).toBeVisible();
    await expect(page.getByText(/update/i)).toBeVisible();
    await expect(page.getByText(/create/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('2. Debería mostrar registros de auditoría de diferentes entidades', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Verificar que hay diferentes tipos de entidades
    await expect(page.getByText(/usuario/i)).toHaveCount(2);
    await expect(page.getByText(/producto/i)).toHaveCount(1);
    await expect(page.getByText(/orden/i)).toHaveCount(1);
    await expect(page.getByText(/sistema/i)).toHaveCount(1);
    await expect(page.getByText(/permiso/i)).toHaveCount(1);
  });

  test('3. Debería filtrar registros por tipo de entidad', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Seleccionar filtro "Usuarios"
    await page.getByRole('combobox', { name: /entidad|entity/i }).selectOption('usuario');
    await expect(page.getByText(/usuario/i)).toHaveCount(2);
    await expect(page.getByText(/producto/i)).not.toBeVisible();

    // Seleccionar filtro "Productos"
    await page.getByRole('combobox', { name: /entidad|entity/i }).selectOption('producto');
    await expect(page.getByText(/producto/i)).toHaveCount(1);
    await expect(page.getByText(/usuario/i)).not.toBeVisible();
  });

  test('4. Debería filtrar registros por severidad', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Seleccionar filtro "Crítico"
    await page.getByRole('combobox', { name: /severidad|severity/i }).selectOption('critical');
    await expect(page.getByText(/critical/i)).toHaveCount(1);
    await expect(page.getByText(/high/i)).not.toBeVisible();

    // Seleccionar filtro "Alto"
    await page.getByRole('combobox', { name: /severidad|severity/i }).selectOption('high');
    await expect(page.getByText(/high/i)).toHaveCount(1);
    await expect(page.getByText(/critical/i)).not.toBeVisible();
  });

  test('5. Debería filtrar registros por rango de fechas', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Establecer rango de fechas
    await page.getByLabel(/fecha.*desde|date.*from/i).fill('2024-01-15');
    await page.getByLabel(/fecha.*hasta|date.*to/i).fill('2024-01-15');
    await page.getByRole('button', { name: /aplicar.*filtros|apply.*filters/i }).click();

    // Verificar que solo se muestran registros en el rango
    await expect(page.getByText(/2024-01-15/i)).toHaveCount(5);
    await expect(page.getByText(/2024-01-16/i)).not.toBeVisible();
  });

  test('6. Debería buscar registros por usuario', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    await expect(page.getByText(/admin@example.com/i)).toHaveCount(4);
    await expect(page.getByText(/sistema/i)).toHaveCount(2);
  });

  test('7. Debería filtrar registros por acción específica', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Seleccionar filtro "Crear"
    await page.getByRole('combobox', { name: /acción|action/i }).selectOption('create');
    await expect(page.getByText(/create/i)).toHaveCount(1);
    await expect(page.getByText(/update/i)).not.toBeVisible();

    // Seleccionar filtro "Actualizar"
    await page.getByRole('combobox', { name: /acción|action/i }).selectOption('update');
    await expect(page.getByText(/update/i)).toHaveCount(1);
    await expect(page.getByText(/create/i)).not.toBeVisible();
  });

  test('8. Debería mostrar detalles completos de cada registro', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Hacer clic en ver detalles del primer registro
    const detailButtons = page.getByRole('button', { name: /ver.*detalles|view.*details/i });
    await detailButtons.first().click();

    // Verificar que se muestra información completa
    await expect(page.getByText(/Entidad.*usuario/i)).toBeVisible();
    await expect(page.getByText(/Entidad ID.*1/i)).toBeVisible();
    await expect(page.getByText(/Usuario.*admin@example.com/i)).toBeVisible();
    await expect(page.getByText(/Acción.*login/i)).toBeVisible();
    await expect(page.getByText(/Descripción.*Inicio de sesión exitoso/i)).toBeVisible();
    await expect(page.getByText(/Fecha.*2024-01-15T08:00:00Z/i)).toBeVisible();
    await expect(page.getByText(/IP.*192\.168\.1\.100/i)).toBeVisible();
    await expect(page.getByText(/Severidad.*low/i)).toBeVisible();
  });

  test('9. Debería mostrar badges de severidad con colores', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Verificar que los registros tienen badges de severidad
    const lowBadges = page.getByText(/low/i);
    await expect(lowBadges).toHaveCount(3);

    const mediumBadges = page.getByText(/medium/i);
    await expect(mediumBadges).toHaveCount(1);

    const highBadges = page.getByText(/high/i);
    await expect(highBadges).toHaveCount(1);

    const criticalBadges = page.getByText(/critical/i);
    await expect(criticalBadges).toHaveCount(1);
  });

  test('10. Debería exportar historial de auditoría', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Verificar que existe el botón de exportar
    await expect(page.getByRole('button', { name: /exportar|export/i })).toBeVisible();
    
    // Hacer clic en exportar
    await page.getByRole('button', { name: /exportar/i }).click();
    
    // Verificar que se genera la descarga
    await expect(page.getByText(/auditoría.*exportada|audit.*exported/i)).toBeVisible();
  });

  test('11. Debería aplicar múltiples filtros simultáneamente', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Aplicar múltiples filtros
    await page.getByRole('combobox', { name: /entidad/i }).selectOption('usuario');
    await page.getByRole('combobox', { name: /severidad/i }).selectOption('high');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    // Verificar que se aplican todos los filtros
    await expect(page.getByText(/usuario/i)).toHaveCount(1);
    await expect(page.getByText(/high/i)).toHaveCount(1);
    await expect(page.getByText(/Eliminación de usuario inactivo/i)).toBeVisible();
  });

  test('12. Debería limpiar todos los filtros', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Aplicar algunos filtros
    await page.getByRole('combobox', { name: /entidad/i }).selectOption('usuario');
    await page.getByRole('combobox', { name: /severidad/i }).selectOption('high');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/usuario/i)).toHaveCount(1);

    // Limpiar filtros
    await page.getByRole('button', { name: /limpiar.*filtros|clear.*filters/i }).click();

    // Verificar que se muestran todos los registros nuevamente
    await expect(page.getByText(/usuario/i)).toHaveCount(2);
    await expect(page.getByText(/producto/i)).toBeVisible();
    await expect(page.getByText(/orden/i)).toBeVisible();
  });

  test('13. Debería mostrar contador de registros por severidad', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Verificar que se muestran contadores de severidad
    await expect(page.getByText(/3.*low|3.*baja/i)).toBeVisible();
    await expect(page.getByText(/1.*medium|1.*media/i)).toBeVisible();
    await expect(page.getByText(/1.*high|1.*alta/i)).toBeVisible();
    await expect(page.getByText(/1.*critical|1.*crítica/i)).toBeVisible();
  });

  test('14. Debería ordenar registros por fecha', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Ordenar por fecha descendente (más reciente primero)
    await page.getByRole('combobox', { name: /ordenar.*por|sort.*by/i }).selectOption('fecha-desc');

    // Verificar que el primer registro es el más reciente
    const firstRow = await page.locator('tbody tr').first();
    await expect(firstRow).toContainText(/2024-01-16T09:15:00Z/); // El registro más reciente
  });

  test('15. Debería mostrar mensaje cuando no hay resultados', async ({ page }) => {
    await page.goto('/admin/historial-auditoria');

    // Aplicar filtro que no devuelve resultados
    await page.getByRole('combobox', { name: /entidad/i }).selectOption('entidad_inexistente');
    await page.getByRole('button', { name: /aplicar.*filtros/i }).click();

    await expect(page.getByText(/no se encontraron.*registros|no.*records.*found/i)).toBeVisible();
  });
});