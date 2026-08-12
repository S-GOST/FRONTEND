import { test, expect } from '@playwright/test';

test.describe('Modulo Autenticación', () => {

    test('Debe permitir iniciar sesión con credenciales válidas', async ({ page }) => {
        await page.goto('/login');

        await page.locator('#usuario').fill('usuario_prueba');
        await page.locator('#contrasena').fill('passwordSegura123');

        await page.getByRole('button', { name: 'Ingresar al panel' }).click();

        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('.welcome-message')).toContainText('Bienvenido');
    });

});