import { test, expect } from '@playwright/test';

test.describe('Módulo Recuperación de Contraseñas', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();
      const email = postData?.email;

      if (!email || !email.includes('@')) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ mensaje: 'Por favor ingrese un correo electrónico válido.' })
        });
      } else if (email === 'noexiste@test.com') {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ mensaje: 'El correo electrónico no está registrado.' })
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, message: 'Correo enviado con éxito.' })
        });
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
  await page.goto('/recuperar-contrasena');

  await expect(page.getByText('Recuperar Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: /enviar/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /volver/ })).toBeVisible();
});

test('2. Debería mostrar error si el campo está vacío', async ({ page }) => {
  await page.goto('/recuperar-contrasena');

  await page.getByRole('button', { name: /enviar/ }).click();

  await expect(page.getByText(/obligatorio/)).toBeVisible();
});

test('3. Debería enviar solicitud exitosa', async ({ page }) => {
  await page.goto('/recuperar-contrasena');

  const requestPromise = page.waitForRequest(req => 
    req.url().includes('/forgot-password')
  );

  await page.getByRole('button', { name: /enviar/ }).click();
  
  const request = await requestPromise;
  const postData = await request.postDataJSON();
  expect(postData.email).toBeDefined();

  await expect(page.getByText(/éxito/)).toBeVisible();
});

test('4. Debería manejar error cuando el correo no existe', async ({ page }) => {
  await page.goto('/recuperar-contrasena');

  await page.getByRole('button', { name: /enviar/ }).click();

  await expect(page.getByText(/no está registrado/)).toBeVisible();
});

test('5. Debería tener enlace funcional para volver al login', async ({ page }) => {
  await page.goto('/recuperar-contrasena');

  const link = page.getByRole('link', { name: /volver/ });
  await expect(link).toHaveAttribute('href', '/login'); 

  await link.click();
  await expect(page).toHaveURL('/login');
})});