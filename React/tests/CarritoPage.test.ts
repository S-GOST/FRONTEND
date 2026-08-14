import { test, expect } from '@playwright/test';
import { CartPage } from './pages/CarritoPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Flujo de carrito de compras', () => {
  let cartPage: CartPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    loginPage = new LoginPage(page);

    // Login previo
    await loginPage.navigate();
    await loginPage.mockSuccessfulLogin(3); // rol cliente
    await loginPage.login('cliente@test.com', '123456');

    // Pre-cargar carrito con items de prueba
    await cartPage.seedCart([
      {
        id: 'prod_1',
        name: 'Aceite Motul 5100',
        price: 85000,
        quantity: 2,
        category: 'Aceite',
        icon: 'droplet-half',
        type: 'producto',
      },
    ]);
  });

  test('debería mostrar los items en el carrito', async ({ page }) => {
    await cartPage.navigate();
    await cartPage.expectLoaded();

    await expect(cartPage.cartItems).toHaveCount(1);
    const item = cartPage.getItemByIndex(0);
    await expect(item.title).toContainText('Aceite Motul 5100');
    await expect(item.quantity).toHaveText('2');
  });

  test('debería completar el checkout con una moto existente', async ({ page }) => {
    await cartPage.navigate();
    await cartPage.mockCartApis();
    await cartPage.mockClientMotos([
      {
        id_moto: 1,
        placa: 'ABC123',
        marca: 'KTM',
        modelo: 'Duke 390',
        cilindraje: '373cc',
        kilometraje: '15000',
        id_cliente: 1,
      },
    ]);

    await cartPage.checkoutWithExistingMoto(0);
    await cartPage.expectNotification('¡Orden de servicio creada exitosamente!');
  });

  test('debería eliminar un item del carrito', async ({ page }) => {
    await cartPage.navigate();
    await cartPage.deleteItem(0);
    await cartPage.confirmDelete();

    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });
});