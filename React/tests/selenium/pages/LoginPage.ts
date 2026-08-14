import { WebDriver, By, until } from 'selenium-webdriver';

export class LoginPage {
  private driver: WebDriver;

  // Localizadores
  private userInput = By.id('usuario');
  private passwordInput = By.id('contrasena');
  private loginButton = By.css('button.login-submit');

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async navigate(baseUrl: string) {
    await this.driver.get(baseUrl);
    await this.driver.manage().window().maximize();
  }

  async login(username: string, password: string) {
    const userField = await this.driver.wait(until.elementLocated(this.userInput), 5000);
    await this.driver.wait(until.elementIsVisible(userField), 5000);
    await userField.sendKeys(username);

    const passwordField = await this.driver.wait(until.elementLocated(this.passwordInput), 5000);
    await this.driver.wait(until.elementIsVisible(passwordField), 5000);
    await passwordField.sendKeys(password);

    const button = await this.driver.wait(until.elementLocated(this.loginButton), 5000);
    await this.driver.wait(until.elementIsVisible(button), 5000);
    await button.click();
  }

  async mockSuccessfulLogin(role: number = 1, dashboardDataMocks: boolean = true) {
    // Generar la conexión CDP con el navegador Control total sobre la interceptación de red, permitiendo mockear respuestas complejas del backend sin depender de métodos defectuosos de la API de Selenium.
    const cdpConnection = await this.driver.createCDPConnection('page');
    const ws = cdpConnection._wsConnection;

    // Helper para enviar comandos CDP directamente por WebSocket
    let cmdId = 1000;
    const cdpSend = (method: string, params: Record<string, any> = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = cmdId++;
        const handler = (data: string) => {
          const response = JSON.parse(data);
          if (response.id === id) {
            ws.removeListener('message', handler);
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    // Habilitar el dominio de Fetch (intercepción de red)
    await cdpSend('Fetch.enable', {
      patterns: [
        { urlPattern: '**/api/auth/*', requestStage: 'Request' },
        { urlPattern: '**/api/admins*', requestStage: 'Request' },
        { urlPattern: '**/api/tecnicos*', requestStage: 'Request' },
        { urlPattern: '**/api/clientes*', requestStage: 'Request' }
      ]
    });

    // Suscribirse a las peticiones interceptadas
    ws.on('message', async (message: string) => {
      const msg = JSON.parse(message);
      if (msg.method === 'Fetch.requestPaused') {
        const { requestId, request } = msg.params;
        const url = request.url;
        const method = request.method;

        console.log(`[CDP Mock] Intercepted: ${method} ${url}`);

        // Obtener el origin de la petición para CORS con credentials
        const origin = request.headers?.Origin || request.headers?.origin || 'http://127.0.0.1:5173';

        // Manejar preflight CORS (OPTIONS) Las peticiones autenticadas ahora funcionan correctamente, respetando las políticas de seguridad del navegador y permitiendo pruebas realistas de autenticación.
        if (method === 'OPTIONS') {
          cdpSend('Fetch.fulfillRequest', {
            requestId,
            responseCode: 204,
            responseHeaders: [
              { name: 'Access-Control-Allow-Origin', value: origin },
              { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
              { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
              { name: 'Access-Control-Allow-Credentials', value: 'true' }
            ],
            body: ''
          }).catch(() => { });
          return;
        }

        let status = 200;
        let body = '';

        if (url.includes('/api/auth/csrf-token')) {
          body = JSON.stringify({});
        } else if (url.includes('/api/auth/login')) {
          body = JSON.stringify({
            id_usuario: 1,
            token: 'mock-token',
            rol: role,
            nombre: 'Usuario Prueba'
          });
        } else if (dashboardDataMocks && (url.includes('/api/admins') || url.includes('/api/tecnicos') || url.includes('/api/clientes'))) {
          body = JSON.stringify({ data: [] });
        } else {
          // Continuar la petición si no coincide con los mocks
          cdpSend('Fetch.continueRequest', { requestId }).catch(() => { });
          return;
        }

        // Fulfill the request with mocked data
        const responseHeaders = [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: origin },
          { name: 'Access-Control-Allow-Credentials', value: 'true' }
        ];

        // Convert body string to base64
        const responseBody = Buffer.from(body).toString('base64');

        cdpSend('Fetch.fulfillRequest', {
          requestId,
          responseCode: status,
          responseHeaders,
          body: responseBody
        }).catch((err: any) => {
          console.error('Error fulfilling request:', err);
        });
      }
    });
  }
}
