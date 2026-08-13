import { test, expect } from '@playwright/test';

test.describe('Modulo Autenticación', () => {

    test('Debe permitir iniciar sesión con credenciales válidas', async ({ page }) => {
        // Simular las respuestas del backend (Mocking) para no depender del servidor real
        await page.route('**/api/auth/csrf-token', route => route.fulfill({ status: 200 }));
        await page.route('**/api/auth/login', route => route.fulfill({
            status: 200,
            json: {
                id_usuario: 1,
                token: 'mock-token',
                rol: 1, // 1 equivale a admin, por lo que redirigirá a /admin/dashboard
                nombre: 'Usuario Prueba'
            }
        }));

        await page.goto('/login');

        await page.locator('#usuario').fill('usuario_prueba');
        await page.locator('#contrasena').fill('passwordSegura123');

        await page.getByRole('button', { name: 'Ingresar al panel' }).click();

        // Esperar que la redirección vaya a la ruta de administrador
        await expect(page).toHaveURL('/admin/dashboard');

        // Esperar a que React renderice el Dashboard verificando que elementos específicos existan.
        // Esto le da tiempo al navegador de pintar la pantalla antes de terminar la prueba.
        await expect(page.getByText('Cerrar sesión')).toBeVisible();

    });

});