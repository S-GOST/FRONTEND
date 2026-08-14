import { Builder, WebDriver, until, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { LoginPage } from './pages/LoginPage';

// Aumentamos el timeout de Jest para pruebas E2E
jest.setTimeout(30000);

describe('Modulo Autenticación (Selenium)', () => {
  let driver: WebDriver;
  const baseUrl = 'http://127.0.0.1:5173'; // El frontend está corriendo en este puerto

  beforeAll(async () => {
    // Configuración del navegador (headless para CI o local sin interfaz)
    const options = new chrome.Options();
    // options.addArguments('--headless=new'); // Comentado para ver el navegador en acción
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    // Selenium Manager descargará/gestionará chromedriver automáticamente
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  test('Debe permitir iniciar sesión con credenciales válidas', async () => {
    const loginPage = new LoginPage(driver);

    // 1. Arrange (Preparar) - Mocks de red CDP
    await loginPage.mockSuccessfulLogin(1, true);

    // 2. Act (Actuar) - Navegación y login
    await loginPage.navigate(`${baseUrl}/login`);
    await loginPage.login('usuario_prueba', 'passwordSegura123');

    // 3. Assert (Verificar)
    // Esperar a que la URL cambie al dashboard de admin
    await driver.wait(until.urlContains('/admin/dashboard'), 5000);

    // Verificar que un elemento específico exista (ej. Botón de cerrar sesión)
    // En este caso buscaremos por texto, usando XPath
    const logoutButton = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(text(), "Cerrar sesión")]')),
      5000
    );
    await driver.wait(until.elementIsVisible(logoutButton), 5000);

    // Verificamos que el elemento sea visible (Selenium lanzará un error si falla el wait anterior)
    const isVisible = await logoutButton.isDisplayed();
    expect(isVisible).toBe(true);

    // PAUSA INTENCIONAL: Esperar 5 segundos para que puedas ver el dashboard en la pantalla
    await driver.sleep(5000);
  });
});
