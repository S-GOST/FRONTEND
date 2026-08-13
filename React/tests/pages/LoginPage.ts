import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userInput = page.locator('#usuario');
    this.passwordInput = page.locator('#contrasena');
    this.loginButton = page.getByRole('button', { name: 'Ingresar al panel' });
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.userInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async mockSuccessfulLogin(role: number = 1, dashboardDataMocks: boolean = true) {
    // Simular las respuestas del backend (Mocking)
    await this.page.route('**/api/auth/csrf-token', route => route.fulfill({ status: 200 }));
    await this.page.route('**/api/auth/login', route => route.fulfill({
      status: 200,
      json: {
        id_usuario: 1,
        token: 'mock-token',
        rol: role,
        nombre: 'Usuario Prueba'
      }
    }));

    if (dashboardDataMocks) {
      await this.page.route('**/api/admins**', route => route.fulfill({ status: 200, json: { data: [] } }));
      await this.page.route('**/api/tecnicos**', route => route.fulfill({ status: 200, json: { data: [] } }));
      await this.page.route('**/api/clientes**', route => route.fulfill({ status: 200, json: { data: [] } }));
      await this.page.route('**/api/ordenes**', route => route.fulfill({ status: 200, json: { data: [] } }));
      await this.page.route('**/api/productos**', route => route.fulfill({ status: 200, json: { data: [] } }));
    }
  }
}
