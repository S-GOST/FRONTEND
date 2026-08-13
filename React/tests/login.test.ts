import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Modulo Autenticación', () => {

    test('Debe permitir iniciar sesión con credenciales válidas', async ({ page }) => {
        // Inicializar el modelo de la página
        const loginPage = new LoginPage(page);

        // 1. Preparar mocks (Simulaciones)
        await loginPage.mockSuccessfulLogin(1); // 1 = admin

        // 2. Navegar
        await loginPage.navigate();

        // 3. Actuar (Realizar el login)
        await loginPage.login('usuario_prueba', 'passwordSegura123');

        // 4. Verificar (Aserciones)
        // Esperar que la redirección vaya a la ruta de administrador
        await expect(page).toHaveURL('/admin/dashboard');

        // Esperar a que React renderice el Dashboard verificando que elementos específicos existan.
        await expect(page.getByText('Cerrar sesión')).toBeVisible();
    });

});