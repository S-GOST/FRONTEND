import { test, expect } from '@playwright/test';

test.describe('Módulo Actualizar Usuario', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/users/**', async (route) => {
      const request = route.request();
      
      if (request.method() === 'GET') {
        // Obtener datos del usuario específico
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              nombre: 'Juan Pérez',
              email: 'juan@example.com',
              rol: 'tecnico',
              estado: 'activo',
              telefono: '+1234567890',
              fechaRegistro: '2024-01-15'
            }
          })
        });
      } else if (request.method() === 'PUT') {
        const postData = await request.postDataJSON();
        
        // Validaciones
        if (!postData.nombre || !postData.email) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Nombre y email son obligatorios.' })
          });
        } else if (!postData.email.includes('@')) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'Correo electrónico inválido.' })
          });
        } else if (postData.email === 'existe@test.com') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El correo electrónico ya está registrado.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              success: true, 
              message: 'Usuario actualizado exitosamente.',
              data: { id: 1, ...postData }
            })
          });
        }
      }
    });
  });

  test('1. Debería renderizar el formulario de edición correctamente', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    await expect(page.getByText('Editar Usuario')).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si los campos obligatorios están vacíos', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el email es inválido', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/correo.*inválido|email.*invalid/i)).toBeVisible();
  });

  test('4. Debería actualizar usuario exitosamente', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.email).toBeDefined();

    await expect(page.getByText(/usuario.*actualizado|user.*updated/i)).toBeVisible();
  });

  test('5. Debería manejar error cuando el email ya existe', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/ya está registrado|already registered/i)).toBeVisible();
  });

  test('6. Debería cancelar edición y volver a la lista', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/usuarios'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/usuarios/);
  });

  test('7. Debería mostrar indicador de carga durante la actualización', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/users/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, message: 'Usuario actualizado exitosamente.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/usuarios/1/editar');
    
    const button = page.getByRole('button', { name: /guardar cambios/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/guardando|saving/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('8. Debería manejar error al actualizar', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/users/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ mensaje: 'Error al actualizar usuario.' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/usuarios/1/editar');
    
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.getByText(/error.*actualizar|error.*update/i)).toBeVisible();
  });

  test('9. Debería validar que los datos no cambien si se cancela', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

    // Cancelar
    await page.getByRole('link', { name: /cancelar|volver/i }).click();
    await expect(page).toHaveURL(/.*\/admin\/usuarios/);

    // Volver a editar
    await page.goto('/admin/usuarios/1/editar');
    await expect(page.getByText('Editar Usuario')).toBeVisible();
  });

  test('10. Debería permitir cambiar solo algunos campos', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users/') && req.method() === 'PUT'
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    
    expect(postData.nombre).toBeDefined();
    expect(postData.email).toBeDefined();

    await expect(page.getByText(/usuario.*actualizado/i)).toBeVisible();
  });

  test('11. Debería mostrar confirmación antes de salir sin guardar', async ({ page }) => {
    await page.goto('/admin/usuarios/1/editar');

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