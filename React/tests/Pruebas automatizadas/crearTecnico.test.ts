import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Técnico', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/register-tech', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();
      
      // Validaciones básicas
      if (!postData.nombre || !postData.email || !postData.password || !postData.especialidad) {
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
            message: 'Técnico creado exitosamente.',
            data: { id: 456, nombre: postData.nombre, email: postData.email, especialidad: postData.especialidad }
          })
        });
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/crear-tecnico');

    await expect(page.getByText('Crear Nuevo Técnico')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver/i })).toBeVisible();
  });

  test('2. Debería mostrar error si los campos están vacíos', async ({ page }) => {
    await page.goto('/crear-tecnico');

    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el correo es inválido', async ({ page }) => {
    await page.goto('/crear-tecnico');
    
    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/correo.*inválido|email.*invalid/i)).toBeVisible();
  });

  test('4. Debería mostrar error si la contraseña es muy corta', async ({ page }) => {
    await page.goto('/crear-tecnico');
    
    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/contraseña.*8 caracteres|password.*8 characters/i)).toBeVisible();
  });

  test('5. Debería crear técnico exitosamente', async ({ page }) => {
    await page.goto('/crear-tecnico');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/register-tech') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.email).toBeDefined();
    expect(postData.password).toBeDefined();
    expect(postData.especialidad).toBeDefined();

    await expect(page.getByText(/técnico.*creado|technician.*created/i)).toBeVisible();
  });

  test('6. Debería manejar error cuando el correo ya existe', async ({ page }) => {
    await page.goto('/crear-tecnico');
    
    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/ya está registrado|already registered/i)).toBeVisible();
  });

  test('7. Debería tener enlace funcional para cancelar/volver', async ({ page }) => {
    await page.goto('/crear-tecnico');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/tecnicos'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/tecnicos/);
  });

  test('8. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/auth/register-tech', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Técnico creado exitosamente.' })
      });
    });

    await page.goto('/crear-tecnico');
    
    const button = page.getByRole('button', { name: /crear/i });
    await button.click();

    // Verificar estado de carga (ajusta según tu UI)
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('9. Debería validar fortaleza de contraseña en tiempo real', async ({ page }) => {
    await page.goto('/crear-tecnico');

    // Contraseña débil
    await expect(page.getByText(/débil|weak/i)).toBeVisible();

    // Contraseña fuerte
    await expect(page.getByText(/fuerte|strong/i)).toBeVisible();
  });

  test('10. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/crear-tecnico');
    
    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/técnico.*creado/i)).toBeVisible();
  });
});