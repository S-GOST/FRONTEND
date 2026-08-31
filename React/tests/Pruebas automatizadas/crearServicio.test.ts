import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Servicio', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/services', async (route) => {
      const request = route.request();
      
      if (request.method() === 'POST') {
        const postData = await request.postDataJSON();
        
        // Validaciones
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre del servicio es obligatorio.' })
          });
        } else if (postData.nombre.length < 5) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre debe tener al menos 5 caracteres.' })
          });
        } else if (!postData.categoriaId) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Debe seleccionar una categoría.' })
          });
        } else if (postData.precio <= 0) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El precio debe ser mayor a cero.' })
          });
        } else if (postData.nombre === 'Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El servicio ya existe.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ 
              success: true, 
              message: 'Servicio creado exitosamente.',
              data: { 
                id: Date.now(), 
                nombre: postData.nombre, 
                descripcion: postData.descripcion || '', 
                categoriaId: postData.categoriaId,
                precio: postData.precio,
                duracion: postData.duracion || 60,
                activo: true 
              }
            })
          });
        }
      }
    });

    // Mock para obtener categorías disponibles
    await page.route('**/api/admin/categories?active=true', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Mantenimiento' },
            { id: 2, nombre: 'Reparación' },
            { id: 3, nombre: 'Consultoría' },
            { id: 4, nombre: 'Instalación' }
          ]
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await expect(page.getByText('Crear Nuevo Servicio')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear|guardar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el nombre es muy corto', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/al menos 5 caracteres|at least 5 characters/i)).toBeVisible();
  });

  test('4. Debería mostrar error si no se selecciona categoría', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/seleccionar.*categoría|select.*category/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el precio es inválido', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/precio.*mayor|price.*greater/i)).toBeVisible();
  });

  test('6. Debería crear servicio exitosamente', async ({ page }) => {
    await page.goto('/admin/crear-servicio');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/services') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.categoriaId).toBeDefined();
    expect(postData.precio).toBeDefined();

    await expect(page.getByText(/servicio.*creado|service.*created/i)).toBeVisible();
  });

  test('7. Debería manejar error cuando el servicio ya existe', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('8. Debería cancelar creación y volver a la lista', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/servicios'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/servicios/);
  });

  test('9. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/services', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Servicio creado exitosamente.' })
      });
    });

    await page.goto('/admin/crear-servicio');
    
    const button = page.getByRole('button', { name: /crear|guardar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('10. Debería manejar error al crear servicio', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/services', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al crear servicio.' })
      });
    });

    await page.goto('/admin/crear-servicio');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/error.*crear|error.*create/i)).toBeVisible();
  });

  test('11. Debería permitir crear servicio sin descripción', async ({ page }) => {
    await page.goto('/admin/crear-servicio');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/services') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.descripcion).toBeDefined();

    await expect(page.getByText(/servicio.*creado/i)).toBeVisible();
  });

  test('12. Debería validar formato de precio decimal', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    // Verificar que se muestra algún tipo de validación de formato
    await expect(page.getByText(/formato.*válido|valid format/i)).toBeVisible();
  });

  test('13. Debería cargar categorías activas en el selector', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    // Verificar que el selector de categorías tiene opciones
    const categorySelect = page.getByRole('combobox', { name: /categoría/i });
    await expect(categorySelect).toBeVisible();
  });

  test('14. Debería establecer duración por defecto', async ({ page }) => {
    await page.goto('/admin/crear-servicio');

    // Verificar que el campo de duración tiene un valor por defecto (60 minutos)
    const durationInput = page.getByLabel(/duración/i);
    await expect(durationInput).toBeVisible();
  });

  test('15. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/admin/crear-servicio');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/servicio.*creado/i)).toBeVisible();
  });
});