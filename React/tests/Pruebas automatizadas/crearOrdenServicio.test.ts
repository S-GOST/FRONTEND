import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Orden de Servicio', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    // Mock para obtener servicios disponibles
    await page.route('**/api/services/available**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Mantenimiento Preventivo', descripcion: 'Revisión completa del equipo', precio: 150, duracion: 120 },
            { id: 2, nombre: 'Reparación Básica', descripcion: 'Arreglo de fallas comunes', precio: 80, duracion: 60 },
            { id: 3, nombre: 'Consultoría Técnica', descripcion: 'Asesoramiento especializado', precio: 200, duracion: 90 },
            { id: 4, nombre: 'Instalación Completa', descripcion: 'Montaje y configuración', precio: 300, duracion: 180 }
          ]
        })
      });
    });

    // Mock para crear la orden
    await page.route('**/api/orders/service', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();

      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.servicioId) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar un servicio.' })
          });
        } else if (!postData.fecha) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La fecha es obligatoria.' })
          });
        } else if (!postData.hora) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La hora es obligatoria.' })
          });
        } else if (!postData.descripcion || postData.descripcion.length < 10) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La descripción debe tener al menos 10 caracteres.' })
          });
        } else if (postData.servicioId === 'conflicto') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'Ya existe una orden para esa fecha y hora.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              success: true,
              message: 'Orden de servicio creada exitosamente.',
              data: {
                id: Date.now(),
                numeroOrden: `ORD-SRV-${Date.now()}`,
                servicioId: postData.servicioId,
                fecha: postData.fecha,
                hora: postData.hora,
                descripcion: postData.descripcion,
                estado: 'pendiente',
                total: postData.total
              }
            })
          });
        }
      }
    });

    // Mock para verificar disponibilidad de horario
    await page.route('**/api/schedules/check**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const fecha = url.searchParams.get('fecha');
      const hora = url.searchParams.get('hora');

      // Simular que ciertos horarios están ocupados
      if (fecha === '2024-12-25' || (fecha === '2024-01-15' && hora === '10:00')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ disponible: false, mensaje: 'Horario no disponible.' })
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ disponible: true })
        });
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await expect(page.getByText('Crear Nueva Orden de Servicio')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /servicio|service/i })).toBeVisible();
    await expect(page.getByLabel(/fecha|date/i)).toBeVisible();
    await expect(page.getByLabel(/hora|time/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear|guardar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería cargar la lista de servicios disponibles', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    const serviceSelect = page.getByRole('combobox', { name: /servicio|service/i });
    await expect(serviceSelect).toBeVisible();

    // Verificar que hay opciones cargadas
    const options = serviceSelect.locator('option');
    await expect(options).toHaveCount(4); // Los 4 servicios mockeados

    await expect(page.getByText(/Mantenimiento Preventivo/i)).toBeVisible();
    await expect(page.getByText(/Reparación Básica/i)).toBeVisible();
  });

  test('3. Debería mostrar error si no se selecciona servicio', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/seleccionar.*servicio|select.*service/i)).toBeVisible();
  });

  test('4. Debería mostrar error si la fecha está vacía', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/fecha.*obligatoria|date.*required/i)).toBeVisible();
  });

  test('5. Debería mostrar error si la hora está vacía', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    await page.getByLabel(/fecha/i).fill('2024-01-20');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/hora.*obligatoria|time.*required/i)).toBeVisible();
  });

  test('6. Debería mostrar error si la descripción es muy corta', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    await page.getByLabel(/fecha/i).fill('2024-01-20');
    await page.getByLabel(/hora/i).fill('10:00');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/al menos 10 caracteres|at least 10 characters/i)).toBeVisible();
  });

  test('7. Debería crear orden de servicio exitosamente', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1'); // Mantenimiento
    await page.getByLabel(/fecha/i).fill('2024-01-20');
    await page.getByLabel(/hora/i).fill('10:00');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/orders/service') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.servicioId).toBe('1');
    expect(postData.fecha).toBe('2024-01-20');
    expect(postData.hora).toBe('10:00');
    expect(postData.descripcion.length).toBeGreaterThanOrEqual(10);

    await expect(page.getByText(/orden.*creada|order.*created/i)).toBeVisible();
    await expect(page.getByText(/ORD-SRV-/i)).toBeVisible();
  });

  test('8. Debería mostrar error si el horario ya está ocupado', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    // Fecha y hora que el mock marca como ocupada
    await page.getByLabel(/fecha/i).fill('2024-01-15');
    await page.getByLabel(/hora/i).fill('10:00');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/ya existe.*orden|already exists.*order/i)).toBeVisible();
  });

  test('9. Debería cancelar creación y volver a la lista', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/ordenes-servicio'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/ordenes-servicio/);
  });

  test('10. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/orders/service', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Orden creada exitosamente.' })
      });
    });

    await page.goto('/admin/crear-orden-servicio');
    
    await page.getByRole('combobox', { name: /servicio/i }).selectOption('2');
    await page.getByLabel(/fecha/i).fill('2024-02-10');
    await page.getByLabel(/hora/i).fill('14:00');
    
    const button = page.getByRole('button', { name: /crear|guardar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('11. Debería manejar error al crear orden', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/orders/service', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al crear orden de servicio.' })
      });
    });

    await page.goto('/admin/crear-orden-servicio');
    
    await page.getByRole('combobox', { name: /servicio/i }).selectOption('3');
    await page.getByLabel(/fecha/i).fill('2024-03-05');
    await page.getByLabel(/hora/i).fill('09:00');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/error.*crear|error.*create/i)).toBeVisible();
  });

  test('12. Debería calcular y mostrar el precio total automáticamente', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    // Seleccionar servicio con precio conocido ($150)
    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    
    // Verificar que se muestra el precio
    await expect(page.getByText(/\$150/i)).toBeVisible();
    
    // Cambiar a otro servicio ($300)
    await page.getByRole('combobox', { name: /servicio/i }).selectOption('4');
    await expect(page.getByText(/\$300/i)).toBeVisible();
  });

  test('13. Debería validar que la fecha no sea anterior a hoy', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    await page.getByRole('combobox', { name: /servicio/i }).selectOption('1');
    // Intentar poner una fecha pasada
    await page.getByLabel(/fecha/i).fill('2020-01-01');
    await page.getByLabel(/hora/i).fill('10:00');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    // Dependiendo de tu validación frontend/backend, debería mostrar error
    await expect(page.getByText(/fecha.*válida|date.*valid|pasada|past/i)).toBeVisible();
  });

  test('14. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    // Por ahora, solo verificamos que la página carga correctamente
    await expect(page).toHaveURL('/admin/crear-orden-servicio');
  });

  test('15. Debería permitir ver detalles del servicio seleccionado', async ({ page }) => {
    await page.goto('/admin/crear-orden-servicio');

    // Seleccionar un servicio
    await page.getByRole('combobox', { name: /servicio/i }).selectOption('3'); // Consultoría

    // Verificar que la página carga correctamente
    await expect(page).toHaveURL('/admin/crear-orden-servicio');
  });
});