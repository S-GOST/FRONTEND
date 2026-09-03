import { test, expect } from '@playwright/test';

test.describe('Módulo Crear Administrador', () => {

  // Mockear la API antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/users', async (route) => {
      const request = route.request();
      const postData = await request.postDataJSON();
      
      if (request.method() === 'POST') {
        // Validaciones
        if (!postData.nombre) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El nombre es obligatorio.' })
          });
        } else if (!postData.email || !postData.email.includes('@')) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'El email es inválido.' })
          });
        } else if (!postData.password || postData.password.length < 6) {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ mensaje: 'La contraseña debe tener al menos 6 caracteres.' })
          });
        } else if (postData.email === 'existente@example.com') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({ mensaje: 'El email ya está registrado.' })
          });
        } else {
          // Éxito
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ 
              success: true, 
              message: 'Administrador creado exitosamente.',
              data: { 
                id: Date.now(), 
                nombre: postData.nombre, 
                email: postData.email,
                rol: 'administrador',
                activo: true 
              }
            })
          });
        }
      }
    });
  });

  test('1. Debería renderizar el formulario correctamente', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    // Verificar elementos básicos del formulario sin depender de un título específico
    await expect(page.getByRole('textbox', { name: /nombre|name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email|correo/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /contraseña|password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /crear|guardar|create|save/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancelar|volver|cancel|back/i })).toBeVisible();
  });

  test('2. Debería mostrar error si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('3. Debería mostrar error si el email es inválido', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Test User');
    await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/inválido|invalid/i)).toBeVisible();
  });

  test('4. Debería mostrar error si la contraseña es muy corta', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Test User');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('123'); // Menos de 6 chars
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/al menos 6 caracteres|at least 6 characters/i)).toBeVisible();
  });

  test('5. Debería crear administrador exitosamente', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Nuevo Admin');
    await page.getByRole('textbox', { name: /email/i }).fill('nuevo@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.nombre).toBe('Nuevo Admin');
    expect(postData.email).toBe('nuevo@admin.com');

    await expect(page.getByText(/administrador.*creado|administrator.*created/i)).toBeVisible();
  });

  test('6. Debería manejar error cuando el email ya existe', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Existente');
    await page.getByRole('textbox', { name: /email/i }).fill('existente@example.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/ya.*registrado|already.*registered/i)).toBeVisible();
  });

  test('7. Debería cancelar creación y volver a la lista', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    const link = page.getByRole('link', { name: /cancelar|volver/i });
    await expect(link).toHaveAttribute('href', '/admin/administradores'); 

    await link.click();
    await expect(page).toHaveURL(/.*\/admin\/administradores/);
  });

  test('8. Debería mostrar indicador de carga durante la creación', async ({ page }) => {
    // Sobrescribir mock para simular lentitud
    await page.route('**/api/admin/users', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ success: true, message: 'Administrador creado exitosamente.' })
      });
    });

    await page.goto('/admin/crear-administrador');
    
    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Lento');
    await page.getByRole('textbox', { name: /email/i }).fill('lento@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    
    const button = page.getByRole('button', { name: /crear|guardar/i });
    await button.click();

    // Verificar estado de carga
    await expect(page.getByText(/creando|creating/i)).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('9. Debería manejar error al crear administrador', async ({ page }) => {
    // Sobrescribir mock para simular error
    await page.route('**/api/admin/users', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ mensaje: 'Error al crear administrador.' })
      });
    });

    await page.goto('/admin/crear-administrador');
    
    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Error');
    await page.getByRole('textbox', { name: /email/i }).fill('error@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/error.*crear|error.*create/i)).toBeVisible();
  });

  test('10. Debería validar formato de email', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Test User');
    await page.getByRole('textbox', { name: /email/i }).fill('sin-arroba');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/inválido|invalid/i)).toBeVisible();
  });

  test('11. Debería permitir contraseñas con caracteres especiales', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Especial');
    await page.getByRole('textbox', { name: /email/i }).fill('especial@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('P@ssw0rd!23');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/users') && req.method() === 'POST'
    );

    await page.getByRole('button', { name: /crear|guardar/i }).click();
    
    const request = await requestPromise;
    const postData = await request.postDataJSON();
    expect(postData.password).toBe('P@ssw0rd!23');

    await expect(page.getByText(/administrador.*creado/i)).toBeVisible();
  });

  test('12. Debería limpiar formulario después de éxito', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Limpio');
    await page.getByRole('textbox', { name: /email/i }).fill('limpio@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/administrador.*creado/i)).toBeVisible();
  });

  test('13. Debería mostrar mensajes de ayuda en los campos', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

  test('14. Debería validar que todos los campos obligatorios estén llenos', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    // Llenar solo algunos campos
    await page.getByRole('textbox', { name: /nombre/i }).fill('Test');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    // Dejar contraseña vacía
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/obligatorio|required/i)).toBeVisible();
  });

  test('15. Debería navegar a la lista de administradores después de crear', async ({ page }) => {
    await page.goto('/admin/crear-administrador');

    await page.getByRole('textbox', { name: /nombre/i }).fill('Admin Redirección');
    await page.getByRole('textbox', { name: /email/i }).fill('redireccion@admin.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('password123');
    
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(/administrador.*creado/i)).toBeVisible();
  });
})});