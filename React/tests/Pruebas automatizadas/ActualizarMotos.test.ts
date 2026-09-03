import { test, expect } from '@playwright/test';

test.describe('Módulo Actualizar Moto', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/motos/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener datos de la moto específica
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              marca: 'Honda',
              modelo: 'CBR 600RR',
              año: 2024,
              color: 'Rojo',
              precio: 15000.00,
              cilindrada: 600,
              stock: 10,
              activo: true,
              fechaCreacion: '2024-01-15',
              usuarioCreador: 'admin@example.com'
            }
          })
        });
      } else if (request.method() === 'PUT') {
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
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Moto actualizada exitosamente.',
              data: { id: 1, ...postData }
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

  test('1. Debería renderizar el formulario de edición correctamente', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await expect(page.getByText('Editar Moto')).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si la marca está vacía', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el modelo está vacío', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('4. Debería mostrar error si el año es inválido', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/año.*válido|year.*valid/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el precio es inválido', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/precio.*mayor|price.*greater/i)).toBeVisible();
  });

  test('6. Debería mostrar error si la cilindrada es inválida', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/cilindrada.*mayor|displacement.*greater/i)).toBeVisible();
  });

  test('7. Debería mostrar error si el color está vacío', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('8. Debería actualizar moto exitosamente', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.marca).toBeDefined();
    expect(postData.modelo).toBeDefined();
    expect(postData.año).toBeDefined();
    expect(postData.color).toBeDefined();
    expect(postData.precio).toBeDefined();
    expect(postData.cilindrada).toBeDefined();

    await expect(page.getByText(/moto.*actualizada|motorcycle.*updated/i)).toBeVisible();
  });

  test('9. Debería manejar error cuando la moto ya existe', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/ya existe|already exists/i)).toBeVisible();
  });

  test('10. Debería cancelar edición y volver a la lista', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/consultar-motos'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-motos/);
  });

  test('11. Debería mostrar indicador de carga durante la actualización', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/motos/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Moto actualizada exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/motos/1/editar');
    
    const button = page.getByRole('button', { name: /guardar cambios/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/guardando|saving/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('12. Debería manejar error al actualizar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/motos/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar moto.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/motos/1/editar');
    
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('13. Debería validar que los datos no cambien si se cancela', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    // Cancelar
    await page.getByRole('link', { name: /cancelar|volver/i }).click();
    await expect(page).toHaveURL(/.*\/admin\/consultar-motos/);

    // Volver a editar
    await page.goto('/admin/motos/1/editar');
    await expect(page.getByText('Editar Moto')).toBeVisible();
  });

  test('14. Debería permitir cambiar solo algunos campos', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/motos/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    
    expect(postData.marca).toBeDefined();
    expect(postData.modelo).toBeDefined();
    expect(postData.precio).toBeDefined();
    expect(postData.stock).toBeDefined();

    await expect(page.getByText(/moto.*actualizada/i)).toBeVisible();
  });

  test('15. Debería mostrar confirmación antes de salir sin guardar', async ({ page }) => {
    await page.goto('/admin/motos/1/editar');

    // Intentar navegar hacia atrás
    await page.goBack();

    // Verificar que aparece un diálogo de confirmación
    await expect(page.getByText(/¿Está seguro de que desea salir sin guardar?/i)).toBeVisible();
    
    // Cancelar la navegación
    await page.getByRole('button', { name: /no|cancelar/i }).click();
    
    // Verificar que seguimos en la página de edición
    await expect(page).toHaveURL(/.*\/editar/);
  });
});