import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Modulo Inicio sesion', () => {

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

    test('Debe redirigir al dashboard de técnico', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Preparar mocks para un Técnico (ID de rol 2 típicamente)
        await loginPage.mockSuccessfulLogin(2);

        // 2. Navegar
        await loginPage.navigate();

        // 3. Actuar
        await loginPage.login('tecnico_prueba', 'passwordSegura123');

        // 4. Verificar
        // Esperar que la redirección vaya a la ruta de técnico
        await expect(page).toHaveURL('/tecnico/dashboard');
        await expect(page.getByText('Salir')).toBeVisible();
    });

    test('Debe redirigir al dashboard de cliente', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Preparar mocks para un Cliente (ID de rol 3 típicamente)
        await loginPage.mockSuccessfulLogin(3);

        // 2. Navegar
        await loginPage.navigate();

        // 3. Actuar
        await loginPage.login('cliente_prueba', 'passwordSegura123');

        // 4. Verificar
        // Esperar que la redirección vaya a la ruta de cliente
        await expect(page).toHaveURL('/cliente/dashboard');
        await expect(page.getByText('Cerrar sesión')).toBeVisible();
    });

    test('Mostrar error con correo no registrado / contraseña incorrecta', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Simular que el servidor responde con error 401 (No autorizado)
        await loginPage.mockFailedLogin(401);

        // 2. Navegar
        await loginPage.navigate();

        // 3. Actuar (Intentar hacer login con datos malos)
        await loginPage.login('usuario_invalido', 'clave_falsa');

        // 4. Verificar
        // Asegurarnos de que no hubo redirección
        await expect(page).toHaveURL('/login');
        // Asegurarnos de que el cartel de error apareció
        await expect(page.getByText('Credenciales incorrectas. Verifica tu usuario y contraseña.')).toBeVisible();
    });

    test('Mostrar validaciones si los campos están vacíos', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // No necesitamos simular el login exitoso o fallido aquí porque no debería llegar al backend
        await loginPage.navigate();

        // 3. Actuar (Click en ingresar sin llenar nada)
        await loginPage.loginButton.click();

        // 4. Verificar
        // Como usamos react-hook-form, debería aparecer "Campo obligatorio" dos veces (una por cada input)
        const errores = page.getByText('Campo obligatorio');
        await expect(errores).toHaveCount(2);

        // Verificar que no navegó a ninguna parte
        await expect(page).toHaveURL('/login');
    });

});