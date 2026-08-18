// Importamos los tipos necesarios desde Playwright
// Page: representa una pestaña o página del navegador
// Locator: representa un elemento localizable en la página
import { Page, Locator } from '@playwright/test';

/**
 * Clase LoginPage que implementa el patrón Page Object Model (POM)
 * Esta clase encapsula toda la lógica relacionada con la página de inicio de sesión,
 * facilitando el mantenimiento y la reutilización del código en las pruebas.
 */
export class LoginPage {
  // Declaración de propiedades de solo lectura para garantizar la inmutabilidad
  // después de la inicialización en el constructor
  readonly page: Page;
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  /**
   * Constructor de la clase LoginPage
   * @param page - Instancia de la página de Playwright donde se ejecutarán las acciones
   */
  constructor(page: Page) {
    // Asignamos la instancia de la página recibida como parámetro
    this.page = page;

    // Inicializamos los localizadores para cada elemento del formulario de login
    // userInput: campo de entrada para el nombre de usuario (identificado por el id "usuario")
    this.userInput = page.locator('#usuario');

    // passwordInput: campo de entrada para la contraseña (identificado por el id "contrasena")
    this.passwordInput = page.locator('#contrasena');

    // loginButton: botón de inicio de sesión, localizado por su rol de "button" y su texto
    // getByRole es más robusto y accesible que selectores CSS
    this.loginButton = page.getByRole('button', { name: 'Ingresar al panel' });
  }

  /**
   * Navega a la página de inicio de sesión
   * Usa la ruta relativa '/login' que se combina con la baseURL configurada
   */
  async navigate() {
    await this.page.goto('/login');
  }

  /**
   * Realiza el proceso completo de inicio de sesión
   * @param username - Nombre de usuario a ingresar
   * @param password - Contraseña a ingresar
   *
   * Este método automatiza el llenado del formulario y el envío de credenciales
   */
  async login(username: string, password: string) {
    // Llena el campo de usuario con el valor proporcionado
    await this.userInput.fill(username);

    // Llena el campo de contraseña con el valor proporcionado
    await this.passwordInput.fill(password);

    // Hace clic en el botón de login para enviar el formulario
    await this.loginButton.click();
  }

  /**
   * Configura mocks (respuestas simuladas) para un login exitoso
   * Esto permite probar el frontend sin depender de un backend real,
   * haciendo las pruebas más rápidas, confiables y aisladas.
   *
   * @param role - El rol del usuario que se simulará (por defecto: 1 = administrador)
   * @param dashboardDataMocks - Indica si se deben mockear también las llamadas del dashboard
   */
  async mockSuccessfulLogin(role: number = 1, dashboardDataMocks: boolean = true) {
    // Intercepta la petición al endpoint de CSRF token y responde con status 200
    await this.page.route('**/api/auth/csrf-token', route => route.fulfill({ status: 200 }));

    // Intercepta la petición de login y responde con datos simulados de autenticación exitosa
    await this.page.route('**/api/auth/login', route => route.fulfill({
      status: 200,
      json: {
        id_usuario: 1,
        token: 'mock-token',
        rol: role,
        nombre: 'Usuario Prueba'
      }
    }));

    // Si se solicitan mocks para los datos del dashboard, intercepta también esas rutas
    if (dashboardDataMocks) {
      // Mock para la lista de administradores
      await this.page.route('**/api/admins**', route => route.fulfill({ status: 200, json: { data: [] } }));

      // Mock para la lista de técnicos
      await this.page.route('**/api/tecnicos**', route => route.fulfill({ status: 200, json: { data: [] } }));

      // Mock para la lista de clientes
      await this.page.route('**/api/clientes**', route => route.fulfill({ status: 200, json: { data: [] } }));

      // Mock para la lista de órdenes
      await this.page.route('**/api/ordenes**', route => route.fulfill({ status: 200, json: { data: [] } }));
    }
  }

  /**
   * Configura mocks para simular un login fallido
   * Útil para probar escenarios de credenciales incorrectas, usuario bloqueado, etc.
   *
   * @param status - Código HTTP de error (por defecto: 401 = No autorizado)
   */
  async mockFailedLogin(status: number = 401) {
    await this.page.route('**/api/auth/csrf-token', route => route.fulfill({ status: 200 }));
    await this.page.route('**/api/auth/login', route => route.fulfill({
      status: status,
      json: { message: 'Credenciales incorrectas' }
    }));
  }
}
