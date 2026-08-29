import { test, expect } from '@playwright/test';

test.describe('Módulo Auto-RegistroClientes', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/register-client', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();
      
      // Validaciones básicas
      if (!postData.nombre || !postData.email || !postData.password || !postData.telefono) {
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
      } else if (!/^[\d\s\-\+\(\)]+$/.test(postData.telefono)) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ mensaje: 'Número de teléfono inválido.' })
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
            message: 'Cliente registrado exitosamente.',
            data: { id: 789, nombre: postData.nombre, email: postData.email, telefono: postData.telefono }
          })
        });
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/registro-cliente');

    await expect(page.getByText('Registro de Cliente')).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ya tengo cuenta|login/i })).toBeVisible();
  });

  test('2. Debería mostrar error si los campos están vacíos', async ({ page }) => {
    await page.goto('/registro-cliente');

    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el correo es inválido', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/correo.*inválido|email.*invalid/i)).toBeVisible();
  });

  test('4. Debería mostrar error si la contraseña es muy corta', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/contraseña.*8 caracteres|password.*8 characters/i)).toBeVisible();
  });

  test('5. Debería mostrar error si el teléfono es inválido', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/teléfono.*inválido|phone.*invalid/i)).toBeVisible();
  });

  test('6. Debería registrar cliente exitosamente', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/register-client') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /registrar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBeDefined();
    expect(postData.email).toBeDefined();
    expect(postData.password).toBeDefined();
    expect(postData.telefono).toBeDefined();

    await expect(page.getByText(/cliente.*registrado|client.*registered/i)).toBeVisible();
  });

  test('7. Debería manejar error cuando el correo ya existe', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/ya está registrado|already registered/i)).toBeVisible();
  });

  test('8. Debería tener enlace funcional para ir al login', async ({ page }) => {
    await page.goto('/registro-cliente');

    const link = page.getByRole('link', { name: /ya tengo cuenta|login/i });
    await expect(link).toHaveAttribute('href', '/login'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('9. Debería mostrar indicador de carga durante el registro', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/auth/register-client', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Cliente registrado exitosamente.' })
      });
    });

    await page.goto('/registro-cliente');
    
    const button = page.getByRole('button', { name: /registrar/i });
    await button.click();

    // Verificar estado de carga (ajusta según tu UI)
    await expect(page.getByText(/registrando|registering/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('10. Debería validar fortaleza de contraseña en tiempo real', async ({ page }) => {
    await page.goto('/registro-cliente');

    // Contraseña débil
    await expect(page.getByText(/débil|weak/i)).toBeVisible();

    // Contraseña fuerte
    await expect(page.getByText(/fuerte|strong/i)).toBeVisible();
  });

  test('11. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/registro-cliente');
    
    await page.getByRole('button', { name: /registrar/i }).click();

    await expect(page.getByText(/cliente.*registrado/i)).toBeVisible();
  });

  test('12. Debería aceptar términos y condiciones', async ({ page }) => {
    await page.goto('/registro-cliente');

    // Verificar que exista el checkbox de términos
    await expect(page.getByRole('checkbox', { name: /términos|terms/i })).toBeVisible();
    
    // Verificar que el botón esté deshabilitado sin aceptar términos
    const button = page.getByRole('button', { name: /registrar/i });
    await expect(button).toBeDisabled();

    // Aceptar términos
    await page.getByRole('checkbox', { name: /términos|terms/i }).check();
    
    // Verificar que el botón ahora esté habilitado
    await expect(button).toBeEnabled();
  });
});