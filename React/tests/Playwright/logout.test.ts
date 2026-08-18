import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Módulo de Cierre de Sesión', () => {

    test('Cierre de sesión manual exitoso', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Preparar login y simular servidor
        await loginPage.mockSuccessfulLogin(1, true);

        // Simular respuesta exitosa del backend al cerrar sesión
        await page.route('/api/auth/logout', route => route.fulfill({ status: 200 }));

        // 2. Realizar login como administrador
        await loginPage.navigate();
        await loginPage.login('admin_prueba', 'password123');

        // Validar que entramos al dashboard
        await expect(page).toHaveURL('/admin/dashboard');

        // 3. Actuar - Cerrar sesión
        const btnCerrarSesion = page.getByRole('button', { name: 'Cerrar sesión' });
        await expect(btnCerrarSesion).toBeVisible();
        await btnCerrarSesion.click();

        // 4. Confirmar en el modal de SweetAlert
        const btnConfirmar = page.getByRole('button', { name: 'Sí, salir' });
        await expect(btnConfirmar).toBeVisible();
        await btnConfirmar.click();

        // 5. Verificar que se invalida la sesión y redirige al login
        await expect(page).toHaveURL('/login');

        // Verificar que el formulario de login vuelva a aparecer
        await expect(page.locator('#usuario')).toBeVisible();
    });

    test('Acceso a ruta protegida sin sesión o después de cerrar sesión', async ({ page }) => {
        // En este test, el navegador comienza limpio (sin tokens en localStorage).
        // Intentamos navegar directamente a una ruta protegida.

        await page.goto('/admin/dashboard');


        // Como no hay sesión, el sistema (AppRoutes) debe protegernos y enviarnos al login.
        await expect(page).toHaveURL('/login');
        await expect(page.locator('#usuario')).toBeVisible();
    });

    test('Cierre por expiración de token (Redirección automática)', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Iniciamos sesión normalmente
        await loginPage.mockSuccessfulLogin(1, true);
        await loginPage.navigate();
        await loginPage.login('admin_prueba', 'password123');
        await expect(page).toHaveURL('/admin/dashboard');

        // 2. Simulamos que el token expira y el backend rechaza una petición (401)
        // El interceptor de Axios capturará esto y lanzará el evento 'auth:unauthorized'
        await page.route('**/api/admins**', route => route.fulfill({ status: 401, json: { message: 'Token expirado' } }));

        // Forzamos una recarga o una acción que dispare la petición
        await page.reload();

        // 3. Verificamos que la aplicación nos expulsa al login
        await expect(page).toHaveURL('/login');
        await expect(page.locator('#usuario')).toBeVisible();
    });

    test('Usuario no autenticado intenta cerrar sesión', async ({ page }) => {
        // Un usuario no autenticado en la página de login no debería ver el botón de cerrar sesión
        await page.goto('/login');
        const btnCerrarSesion = page.getByRole('button', { name: 'Cerrar sesión' });
        await expect(btnCerrarSesion).toBeHidden();
    });

    test('Cierre automático por inactividad', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Iniciamos sesión normalmente
        await loginPage.mockSuccessfulLogin(1, true);
        await loginPage.navigate();
        await loginPage.login('admin_prueba', 'password123');
        await expect(page).toHaveURL('/admin/dashboard');

        // 2. Controlar el tiempo del navegador DESPUÉS de que la app haya cargado
        await page.clock.install();

        // 3. Mover el mouse para disparar el evento 'mousemove' en la app.
        // Esto hace que nuestro hook `useInactivityTimer` limpie el temporizador nativo
        // y cree uno nuevo, esta vez usando el `setTimeout` falso de Playwright.
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200);

        // 4. Simular que pasan 30 minutos sin actividad (1800000 ms)
        await page.clock.fastForward('31:00');

        // Reanudamos el reloj para que las animaciones de SweetAlert2 puedan ejecutarse
        await page.clock.resume();

        // 5. Verificar que aparece el modal de advertencia de sesión expirada
        await expect(page.getByText('Sesión expirada por inactividad')).toBeVisible();

        // Al confirmar en el modal de inactividad, debe sacarnos al login
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page).toHaveURL('/login');
    });

});
