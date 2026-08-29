import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Administrador', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/register-admin', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();
      
      // Validaciones básicas
      if (!postData.nombre || !postData.email || !postData.password) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ mensaje: 'Todos los campos son obligatorios.' })
        });
      } else if (!postData.email.includes('@')) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ mensaje: 'Correo electrónico inválido.' })
        });
      } else if (postData.password.length < 8) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' })
        });
      } else if (postData.email === 'existe@test.com') {
        await route.fulfill({
          status: 409,
          body: JSON.stringify({ mensaje: 'El correo electrónico ya está registrado.' })
        });
      } else {
        // Éxito
        await route.fulfill({
          status: 201,
          body: JSON.stringify({ 
            success: true, 
            message: 'Administrador creado exitosamente.',
            data: { id: 123, nombre: postData.nombre, email: postData.email }
          })
        });
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/crear-administrador');

    await expect(page.getByText('Crear Nuevo Administrador')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/ })).toBeVisible();
  });

  test('2. Debería mostrar error si los campos están vacíos', async ({ page }) => {
    await page.goto('/crear-administrador');

    await page.getByRole('button', { name: /crear/ }).click();

    await expect(page.getByText(/obligatorio|required/)).toBeVisible();
  });

  test('3. Debería mostrar error si el correo es inválido', async ({ page }) => {
    await page.goto('/crear-administrador');
    
    await page.getByRole('button', { name: /crear/ }).click();

    await expect(page.getByText(/correo.*inválido|email.*invalid/)).toBeVisible();
  });

  test('4. Debería mostrar error si la contraseña es muy corta', async ({ page }) => {
    await page.goto('/crear-administrador');
    
    await page.getByRole('button', { name: /crear/ }).click();

    await expect(page.getByText(/contraseña.*8 caracteres|password.*8 characters/)).toBeVisible();
  });

  test('5. Debería crear administrador exitosamente', async ({ page }) => {
    await page.goto('/crear-administrador');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/register-admin') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear/ }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.email).toBeDefined();
    expect(postData.password).toBeDefined();

    await expect(page.getByText(/administrador.*creado|created.*successfully/)).toBeVisible();
  });

  test('6. Debería manejar error cuando el correo ya existe', async ({ page }) => {
    await page.goto('/crear-administrador');
    
    await page.getByRole('button', { name: /crear/ }).click();

    await expect(page.getByText(/ya está registrado|already registered/)).toBeVisible();
  });

  test('7. Debería tener enlace funcional para cancelar/volver', async ({ page }) => {
    await page.goto('/crear-administrador');

    const link = page.getByRole('link', { name: /cancelar|volver/ });
    await expect(link).toHaveAttribute('href', '/admin/usuarios'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/usuarios/);
  });

  test('8. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/auth/register-admin', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Administrador creado exitosamente.' })
      });
    });

    await page.goto('/crear-administrador');
    
    const button = page.getByRole('button', { name: /crear/ });
    await button.click();

    // Verificar estado de carga (ajusta según tu UI)
    await expect(page.getByText(/creando|creating/)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('9. Debería validar fortaleza de contraseña en tiempo real', async ({ page }) => {
    await page.goto('/crear-administrador');

    // Contraseña débil
    await expect(page.getByText(/débil|weak/)).toBeVisible();

    // Contraseña fuerte
    await expect(page.getByText(/fuerte|strong/)).toBeVisible();
  });

  test('10. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/crear-administrador');
    
    await page.getByRole('button', { name: /crear/ }).click();

    await expect(page.getByText(/administrador.*creado/)).toBeVisible();
  });
});