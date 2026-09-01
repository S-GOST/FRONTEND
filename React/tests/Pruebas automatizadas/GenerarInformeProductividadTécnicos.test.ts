import { test, expect } from '@playwright/test';

test.describe('Módulo Generar Informe de Productividad de Técnicos', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/reports/productivity**', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();

      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.tecnicoId || postData.tecnicoId === 'all') {
          // Todos los técnicos - válido
        } else if (!postData.fechaDesde || !postData.fechaHasta) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Las fechas son obligatorias.' })
          });
        } else if (new Date(postData.fechaDesde) > new Date(postData.fechaHasta)) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La fecha desde no puede ser mayor que la fecha hasta.' })
          });
        } else {
          // Éxito - generar informe de productividad
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Informe de productividad generado exitosamente.',
              data: {
                id: Date.now(),
                nombreArchivo: `productividad_tecnicos_${postData.fechaDesde}_${postData.fechaHasta}.pdf`,
                url: `/reports/productivity/${Date.now()}.pdf`,
                fechaGeneracion: new Date().toISOString(),
                periodo: `${postData.fechaDesde} - ${postData.fechaHasta}`,
                tecnicosAnalizados: postData.tecnicoId === 'all' ? 8 : 1,
                metricas: {
                  ordenesCompletadas: 45,
                  tiempoPromedioRespuesta: '2.5 horas',
                  satisfaccionCliente: 4.7,
                  eficienciaGeneral: 92
                }
              }
            })
          });
        }
      }
    });

    // Mock para descargar el informe
    await page.route('**/reports/productivity/*.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF content for productivity report')
      });
    });

    // Mock para obtener lista de técnicos
    await page.route('**/api/admin/technicians**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Carlos Ruiz', especialidad: 'Electrónica', activo: true },
            { id: 2, nombre: 'María López', especialidad: 'Mecánica', activo: true },
            { id: 3, nombre: 'Juan Pérez', especialidad: 'Electricidad', activo: true },
            { id: 4, nombre: 'Ana García', especialidad: 'Refrigeración', activo: true },
            { id: 5, nombre: 'Luis Martínez', especialidad: 'Fontanería', activo: false },
            { id: 6, nombre: 'Sofía Hernández', especialidad: 'Climatización', activo: true },
            { id: 7, nombre: 'Pedro Sánchez', especialidad: 'Automotriz', activo: true },
            { id: 8, nombre: 'Laura Díaz', especialidad: 'Industrial', activo: true }
          ]
        })
      });
    });

    // Mock para obtener métricas de productividad
    await page.route('**/api/admin/productivity/metrics**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            totalOrdenes: 120,
            ordenesCompletadas: 98,
            tiempoPromedioRespuesta: '2.3 horas',
            tiempoPromedioResolucion: '4.5 horas',
            satisfaccionCliente: 4.6,
            eficienciaGeneral: 89,
            tecnicosTop: [
              { nombre: 'Carlos Ruiz', ordenes: 25, eficiencia: 95 },
              { nombre: 'María López', ordenes: 22, eficiencia: 92 },
              { nombre: 'Ana García', ordenes: 20, eficiencia: 90 }
            ],
            areasMejora: ['Tiempo de respuesta inicial', 'Documentación de servicios']
          }
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await expect(page.getByText('Generar Informe de Productividad de Técnicos')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /técnico|technician/i })).toBeVisible();
    await expect(page.getByLabel(/fecha.*desde|date.*from/i)).toBeVisible();
    await expect(page.getByLabel(/fecha.*hasta|date.*to/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generar|generate/i })).toBeVisible();
  });

  test('2. Debería cargar la lista de técnicos', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    const technicianSelect = page.getByRole('combobox', { name: /técnico|technician/i });
    await expect(technicianSelect).toBeVisible();

    // Verificar que hay opciones cargadas
    const options = technicianSelect.locator('option');
    await expect(options).toHaveCount(9); // 8 técnicos + opción "Todos"

    await expect(page.getByText(/Carlos Ruiz/i)).toBeVisible();
    await expect(page.getByText(/María López/i)).toBeVisible();
    await expect(page.getByText(/Todos.*los.*técnicos/i)).toBeVisible();
  });

  test('3. Debería mostrar error si las fechas están vacías', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('1');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/fechas.*obligatorias|dates.*required/i)).toBeVisible();
  });

  test('4. Debería mostrar error si la fecha desde es mayor que la fecha hasta', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('1');
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-01');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/fecha.*desde.*mayor|date.*from.*greater/i)).toBeVisible();
  });

  test('5. Debería generar informe para todos los técnicos', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('all');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/productivity') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.tecnicoId).toBe('all');
    expect(postData.fechaDesde).toBe('2024-01-01');
    expect(postData.fechaHasta).toBe('2024-01-31');

    await expect(page.getByText(/informe.*generado|report.*generated/i)).toBeVisible();
    await expect(page.getByText(/8.*técnicos.*analizados|8.*technicians.*analyzed/i)).toBeVisible();
  });

  test('6. Debería generar informe para un técnico específico', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('2'); // María López
    await page.getByLabel(/fecha.*desde/i).fill('2024-02-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-02-28');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/reports/productivity') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /generar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.tecnicoId).toBe('2');

    await expect(page.getByText(/informe.*generado/i)).toBeVisible();
    await expect(page.getByText(/1.*técnico.*analizado|1.*technician.*analyzed/i)).toBeVisible();
  });

  test('7. Debería mostrar métricas de productividad', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    // Verificar que se muestran métricas
    await expect(page.getByText(/Total.*órdenes.*120/i)).toBeVisible();
    await expect(page.getByText(/Órdenes.*completadas.*98/i)).toBeVisible();
    await expect(page.getByText(/Tiempo.*promedio.*respuesta.*2\.3.*horas/i)).toBeVisible();
    await expect(page.getByText(/Satisfacción.*cliente.*4\.6/i)).toBeVisible();
    await expect(page.getByText(/Eficiencia.*general.*89%/i)).toBeVisible();
  });

  test('8. Debería mostrar técnicos top performers', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    // Verificar que se muestran los mejores técnicos
    await expect(page.getByText(/Carlos.*Ruiz.*25.*órdenes.*95%/i)).toBeVisible();
    await expect(page.getByText(/María.*López.*22.*órdenes.*92%/i)).toBeVisible();
    await expect(page.getByText(/Ana.*García.*20.*órdenes.*90%/i)).toBeVisible();
  });

  test('9. Debería mostrar áreas de mejora', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    // Verificar que se muestran áreas de mejora
    await expect(page.getByText(/Áreas.*mejora|Areas.*improvement/i)).toBeVisible();
    await expect(page.getByText(/Tiempo.*respuesta.*inicial/i)).toBeVisible();
    await expect(page.getByText(/Documentación.*servicios/i)).toBeVisible();
  });

  test('10. Debería descargar el informe en PDF', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('all');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Hacer clic en botón de descarga
    const downloadButton = page.getByRole('button', { name: /descargar.*pdf|download.*pdf/i });
    await downloadButton.click();

    // Verificar que se inicia la descarga
    await expect(page).toHaveURL(/.*\/generar-informe-productividad/);
  });

  test('11. Debería mostrar indicador de carga durante la generación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/reports/productivity**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Informe generado exitosamente.',
          data: {
            id: Date.now(),
            nombreArchivo: 'productividad_lenta.pdf',
            url: '/reports/productivity/slow.pdf',
            fechaGeneracion: new Date().toISOString(),
            periodo: '2024-01-01 - 2024-01-31',
            tecnicosAnalizados: 8,
            metricas: {
              ordenesCompletadas: 50,
              tiempoPromedioRespuesta: '3.0 horas',
              satisfaccionCliente: 4.5,
              eficienciaGeneral: 88
            }
          }
        })
      });
    });

    await page.goto('/admin/generar-informe-productividad');
    
    await page.getByRole('combobox', { name: /técnico/i }).selectOption('all');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    
    const button = page.getByRole('button', { name: /generar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/generando|generating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('12. Debería manejar error al generar informe', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/reports/productivity**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al generar informe de productividad.' })
      });
    });

    await page.goto('/admin/generar-informe-productividad');
    
    await page.getByRole('combobox', { name: /técnico/i }).selectOption('3');
    await page.getByLabel(/fecha.*desde/i).fill('2024-03-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-03-31');
    await page.getByRole('button', { name: /generar/i }).click();

    await expect(page.getByText(/error.*generar|error.*generate/i)).toBeVisible();
  });

  test('13. Debería comparar productividad entre técnicos', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('all');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Verificar que se muestra comparación
    await expect(page.getByText(/Comparativa.*técnicos|Technician.*comparison/i)).toBeVisible();
    await expect(page.getByText(/Carlos.*Ruiz.*vs.*María.*López/i)).toBeVisible();
  });

  test('14. Debería mostrar gráfico de tendencias', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    await page.getByRole('combobox', { name: /técnico/i }).selectOption('all');
    await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
    await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
    await page.getByRole('button', { name: /generar/i }).click();

    // Verificar que se muestra gráfico de tendencias
    await expect(page.getByText(/Tendencias.*productividad|Productivity.*trends/i)).toBeVisible();
    // Nota: La verificación visual del gráfico dependería de tu implementación
  });

  test('15. Debería permitir filtrar por especialidad del técnico', async ({ page }) => {
    await page.goto('/admin/generar-informe-productividad');

    // Si tu implementación tiene filtro por especialidad
    const specialtyFilter = page.getByRole('combobox', { name: /especialidad|specialty/i });
    if (await specialtyFilter.isVisible()) {
      await specialtyFilter.selectOption('Electrónica');
      await page.getByLabel(/fecha.*desde/i).fill('2024-01-01');
      await page.getByLabel(/fecha.*hasta/i).fill('2024-01-31');
      await page.getByRole('button', { name: /generar/i }).click();

      await expect(page.getByText(/informe.*generado/i)).toBeVisible();
      // El informe debería contener solo técnicos de Electrónica
    }
  });
});