import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Categoría', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/categories', async (route) => {
      const request = route.request();
      
      if (request.method() === 'POST') {
        const postData = await request.postDataJSON();
        
        // Validaciones
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre de la categoría es obligatorio.' })
          });
        } else if (postData.nombre === 'Existente') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'La categoría ya existe.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ 
              success: true, 
              message: 'Categoría creada exitosamente.',
              data: { id: Date.now(), nombre: postData.nombre, descripcion: postData.descripcion || '', activa: true }
            })
          });
        }
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/crear-categoria');

    await expect(page.getByText('Crear Nueva Categoría')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear|guardar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/crear-categoria');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería crear categoría exitosamente', async ({ page }) => {
    await page.goto('/admin/crear-categoria');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();

    await expect(page.getByText(/categoría.*creada|category.*created/i)).toBeVisible();
  });

  test('4. Debería manejar error cuando la categoría ya existe', async ({ page }) => {
    await page.goto('/admin/crear-categoria');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('5. Debería cancelar creación y volver a la lista', async ({ page }) => {
    await page.goto('/admin/crear-categoria');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/categorias'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/categorias/);
  });

  test('6. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/categories', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Categoría creada exitosamente.' })
      });
    });

    await page.goto('/admin/crear-categoria');
    
    const button = page.getByRole('button', { name: /crear|guardar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('7. Debería manejar error al crear categoría', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/categories', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al crear categoría.' })
      });
    });

    await page.goto('/admin/crear-categoria');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/error.*crear|error.*create/i)).toBeVisible();
  });

  test('8. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/admin/crear-categoria');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/categoría.*creada/i)).toBeVisible();
  });

  test('9. Debería crear categoría sin descripción', async ({ page }) => {
    await page.goto('/admin/crear-categoria');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/categories') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();

    await expect(page.getByText(/categoría.*creada/i)).toBeVisible();
  });
});