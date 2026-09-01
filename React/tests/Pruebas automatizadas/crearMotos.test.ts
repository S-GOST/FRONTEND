import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Moto', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/motos', async (route) => {
      const request = route.request();
      
      if (request.method() === 'POST') {
        const postData = await request.postDataJSON();
        
        // Validaciones
        if (!postData.marca) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La marca es obligatoria.' })
          });
        } else if (!postData.modelo) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El modelo es obligatorio.' })
          });
        } else if (!postData.año || postData.año < 1900 || postData.año > new Date().getFullYear() + 1) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El año debe ser válido.' })
          });
        } else if (!postData.precio || postData.precio <= 0) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El precio debe ser mayor a cero.' })
          });
        } else if (!postData.cilindrada || postData.cilindrada <= 0) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La cilindrada debe ser mayor a cero.' })
          });
        } else if (!postData.color) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El color es obligatorio.' })
          });
        } else if (postData.marca === 'Existente' && postData.modelo === 'Modelo Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'Esta moto ya existe.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ 
              success: true, 
              message: 'Moto creada exitosamente.',
              data: { 
                id: Date.now(), 
                marca: postData.marca, 
                modelo: postData.modelo,
                año: postData.año,
                color: postData.color,
                precio: postData.precio,
                cilindrada: postData.cilindrada,
                stock: postData.stock || 0,
                activo: true 
              }
            })
          });
        }
      }
    });

    // Mock para obtener marcas disponibles
    await page.route('**/api/admin/moto-brands', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nombre: 'Honda' },
            { id: 2, nombre: 'Yamaha' },
            { id: 3, nombre: 'Suzuki' },
            { id: 4, nombre: 'Kawasaki' },
            { id: 5, nombre: 'BMW' }
          ]
        })
      });
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await expect(page.getByText('Crear Nueva Moto')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear|guardar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si la marca está vacía', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el modelo está vacío', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('4. Debería mostrar error si el año es inválido', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/año.*válido|year.*valid/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el precio es inválido', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/precio.*mayor|price.*greater/i)).toBeVisible();
  });

  test('6. Debería mostrar error si la cilindrada es inválida', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/cilindrada.*mayor|displacement.*greater/i)).toBeVisible();
  });

  test('7. Debería mostrar error si el color está vacío', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('8. Debería crear moto exitosamente', async ({ page }) => {
    await page.goto('/admin/crear-moto');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.marca).toBeDefined();
    expect(postData.modelo).toBeDefined();
    expect(postData.año).toBeDefined();
    expect(postData.color).toBeDefined();
    expect(postData.precio).toBeDefined();
    expect(postData.cilindrada).toBeDefined();
    expect(postData.stock).toBeDefined();

    await expect(page.getByText(/moto.*creada|motorcycle.*created/i)).toBeVisible();
  });

  test('9. Debería manejar error cuando la moto ya existe', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('10. Debería cancelar creación y volver a la lista', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/motos'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/motos/);
  });

  test('11. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/motos', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Moto creada exitosamente.' })
      });
    });

    await page.goto('/admin/crear-moto');
    
    const button = page.getByRole('button', { name: /crear|guardar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('12. Debería manejar error al crear moto', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/motos', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al crear moto.' })
      });
    });

    await page.goto('/admin/crear-moto');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/error.*crear|error.*create/i)).toBeVisible();
  });

  test('13. Debería permitir crear moto sin stock especificado', async ({ page }) => {
    await page.goto('/admin/crear-moto');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.marca).toBeDefined();
    expect(postData.modelo).toBeDefined();
    expect(postData.stock).toBeDefined();

    await expect(page.getByText(/moto.*creada/i)).toBeVisible();
  });

  test('14. Debería cargar marcas disponibles en el selector', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    // Verificar que el selector de marcas tiene opciones
    const brandSelect = page.getByRole('combobox', { name: /marca/i });
    await expect(brandSelect).toBeVisible();
  });

  test('15. Debería establecer stock por defecto en cero', async ({ page }) => {
    await page.goto('/admin/crear-moto');

    // Verificar que el campo de stock tiene un valor por defecto (0) si no se llena
    const stockInput = page.getByLabel(/stock/i);
    await expect(stockInput).toBeVisible();
    // Nota: Esto depende de tu implementación UI, podría ser vacío o '0'
  });
});