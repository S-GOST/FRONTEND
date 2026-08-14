// Importamos los tipos necesarios desde Playwright
import { Page, Locator, expect } from '@playwright/test';

/**
 * Clase CartPage que implementa el patrón Page Object Model (POM)
 * Encapsula toda la lógica y los elementos de la página de carrito de compras,
 * facilitando la escritura de pruebas E2E para el flujo de compra.
 */
export class CarritoPage {
  readonly page: Page;

  // === LOCALIZADORES PRINCIPALES ===
  // Cabecera del carrito
  readonly cartTitle: Locator;
  readonly cartSubtitle: Locator;

  // Lista de items del carrito
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;

  // Resumen del pedido
  readonly cartSummary: Locator;
  readonly summaryRows: Locator;
  readonly totalValue: Locator;

  // Botones de acción principal
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  // Notificaciones
  readonly notification: Locator;

  // Sección de recomendaciones
  readonly recommendationsGrid: Locator;
  readonly recommendationCards: Locator;

  // === MODALES ===
  readonly modalOverlay: Locator;
  readonly modalContent: Locator;
  readonly modalTitle: Locator;

  // Modal de eliminación
  readonly deleteModalConfirmButton: Locator;
  readonly deleteModalCancelButton: Locator;

  // Modal de checkout
  readonly checkoutModalNextButton: Locator;
  readonly checkoutModalBackButton: Locator;
  readonly checkoutModalSaveOrderButton: Locator;

  // Formulario de moto en el checkout
  readonly motoCards: Locator;
  readonly newMotoCard: Locator;
  readonly placaInput: Locator;
  readonly marcaInput: Locator;
  readonly modeloInput: Locator;
  readonly cilindrajeInput: Locator;
  readonly kilometrajeInput: Locator;

  /**
   * Constructor de la clase CartPage
   * @param page - Instancia de la página de Playwright
   */
  constructor(page: Page) {
    this.page = page;

    // === Inicialización de localizadores principales ===
    this.cartTitle = page.locator('.cart-title');
    this.cartSubtitle = page.locator('.cart-subtitle');

    // Lista de items dentro del carrito
    this.cartItems = page.locator('.cart-item');
    this.emptyCartMessage = page.locator('.empty-cart');

    // Resumen del pedido (panel derecho)
    this.cartSummary = page.locator('.cart-summary');
    this.summaryRows = page.locator('.summary-row');
    this.totalValue = page.locator('.total-value');

    // Botones principales del carrito
    this.checkoutButton = page.locator('.btn-checkout');
    this.continueShoppingButton = page.locator('.btn-continue').first();

    // Sistema de notificaciones toast
    this.notification = page.locator('.cart-notification');

    // Sección de productos recomendados
    this.recommendationsGrid = page.locator('.recommendations-grid');
    this.recommendationCards = page.locator('.recommendation-card');

    // === Inicialización de modales ===
    this.modalOverlay = page.locator('.modal-overlay');
    this.modalContent = page.locator('.modal-content');
    this.modalTitle = page.locator('.modal-title');

    // Botones del modal de confirmación de eliminación
    // Usamos .first() para el botón primario (eliminar) y .last() para cancelar
    this.deleteModalConfirmButton = page.locator('.modal-footer .btn-danger');
    this.deleteModalCancelButton = page.locator('.modal-footer .btn-secondary').first();

    // Botones del modal de checkout
    this.checkoutModalNextButton = page.locator('.modal-footer .btn-ktm');
    this.checkoutModalBackButton = page.locator('.modal-footer .btn-secondary').first();
    this.checkoutModalSaveOrderButton = page.locator('.modal-footer .btn-ktm');

    // === Localizadores del formulario de moto ===
    this.motoCards = page.locator('.moto-card:not(.moto-card--new)');
    this.newMotoCard = page.locator('.moto-card--new');
    this.placaInput = page.locator('.moto-form-input').nth(0);
    this.marcaInput = page.locator('.moto-form-input').nth(1);
    this.modeloInput = page.locator('.moto-form-input').nth(2);
    this.cilindrajeInput = page.locator('.moto-form-input').nth(3);
    this.kilometrajeInput = page.locator('.moto-form-input').nth(4);
  }

  /**
   * Navega a la página del carrito
   */
  async navigate() {
    await this.page.goto('/Cart');
  }

  /**
   * Verifica que la página del carrito se haya cargado correctamente
   */
  async expectLoaded() {
    await expect(this.cartTitle).toBeVisible();
    await expect(this.cartTitle).toContainText('TU CARRITO DE COMPRAS');
  }

  /**
   * Obtiene la cantidad total de items en el carrito
   * @returns Número de items visibles
   */
  async getItemsCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Verifica si el carrito está vacío
   * @returns true si el carrito muestra el mensaje de vacío
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * Obtiene un item específico del carrito por su índice
   * @param index - Índice del item (0-based)
   * @returns Objeto con los localizadores del item
   */
  getItemByIndex(index: number) {
    const item = this.cartItems.nth(index);
    return {
      container: item,
      title: item.locator('.item-title'),
      category: item.locator('.item-category'),
      description: item.locator('.item-description'),
      quantity: item.locator('.qty-value'),
      subtotal: item.locator('.item-subtotal'),
      minusButton: item.locator('.qty-btn.minus'),
      plusButton: item.locator('.qty-btn.plus'),
      deleteButton: item.locator('.delete-btn'),
    };
  }

  /**
   * Obtiene un item del carrito por su nombre
   * @param name - Nombre del producto
   * @returns Objeto con los localizadores del item
   */
  getItemByName(name: string) {
    const item = this.cartItems.filter({ hasText: name });
    return {
      container: item,
      title: item.locator('.item-title'),
      category: item.locator('.item-category'),
      quantity: item.locator('.qty-value'),
      subtotal: item.locator('.item-subtotal'),
      minusButton: item.locator('.qty-btn.minus'),
      plusButton: item.locator('.qty-btn.plus'),
      deleteButton: item.locator('.delete-btn'),
    };
  }

  /**
   * Incrementa la cantidad de un item en el carrito
   * @param index - Índice del item
   */
  async increaseQuantity(index: number) {
    const item = this.getItemByIndex(index);
    await item.plusButton.click();
  }

  /**
   * Decrementa la cantidad de un item en el carrito
   * Si la cantidad llega a 0, se abre el modal de confirmación de eliminación
   * @param index - Índice del item
   */
  async decreaseQuantity(index: number) {
    const item = this.getItemByIndex(index);
    await item.minusButton.click();
  }

  /**
   * Elimina un item del carrito directamente desde el botón de basura
   * Abre el modal de confirmación
   * @param index - Índice del item a eliminar
   */
  async deleteItem(index: number) {
    const item = this.getItemByIndex(index);
    await item.deleteButton.click();
  }

  /**
   * Confirma la eliminación en el modal
   */
  async confirmDelete() {
    await expect(this.modalOverlay).toBeVisible();
    await this.deleteModalConfirmButton.click();
    await expect(this.modalOverlay).not.toBeVisible();
  }

  /**
   * Cancela la eliminación en el modal
   */
  async cancelDelete() {
    await this.deleteModalCancelButton.click();
    await expect(this.modalOverlay).not.toBeVisible();
  }

  /**
   * Obtiene el valor total mostrado en el resumen del pedido
   * @returns String con el texto del total
   */
  async getTotalValue(): Promise<string> {
    return await this.totalValue.innerText();
  }

  /**
   * Hace clic en el botón "Proceder al Pago"
   * Abre el modal de checkout en su primer paso
   */
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await expect(this.modalOverlay).toBeVisible();
  }

  /**
   * Avanza al segundo paso del checkout (datos de la moto)
   */
  async goToMotoStep() {
    await this.checkoutModalNextButton.click();
    // Esperamos a que el título cambie al del paso 2
    await expect(this.modalTitle).toContainText('Datos de la Motocicleta');
  }

  /**
   * Selecciona una moto existente del usuario en el modal de checkout
   * @param index - Índice de la moto (0-based)
   */
  async selectMoto(index: number) {
    const moto = this.motoCards.nth(index);
    await moto.click();
    await expect(moto).toHaveClass(/moto-card--selected/);
  }

  /**
   * Selecciona la opción de registrar una nueva moto
   */
  async selectNewMoto() {
    await this.newMotoCard.click();
    await expect(this.newMotoCard).toHaveClass(/moto-card--selected/);
  }

  /**
   * Llena el formulario de nueva moto con los datos proporcionados
   * @param data - Datos de la moto
   */
  async fillNewMotoForm(data: {
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
  }) {
    await this.placaInput.fill(data.placa);
    await this.marcaInput.fill(data.marca);
    await this.modeloInput.fill(data.modelo);
    await this.cilindrajeInput.fill(data.cilindraje);
    await this.kilometrajeInput.fill(data.kilometraje);
  }

  /**
   * Guarda la orden de servicio (envía el checkout al backend)
   */
  async saveOrder() {
    await this.checkoutModalSaveOrderButton.click();
  }

  /**
   * Flujo completo de checkout con una moto existente
   */
  async checkoutWithExistingMoto(motoIndex: number = 0) {
    await this.proceedToCheckout();
    await this.goToMotoStep();
    await this.selectMoto(motoIndex);
    await this.saveOrder();
  }

  /**
   * Flujo completo de checkout registrando una nueva moto
   */
  async checkoutWithNewMoto(motoData: {
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
  }) {
    await this.proceedToCheckout();
    await this.goToMotoStep();
    await this.selectNewMoto();
    await this.fillNewMotoForm(motoData);
    await this.saveOrder();
  }

  /**
   * Agrega un producto desde la sección de recomendaciones
   * @param index - Índice del producto recomendado (0-based)
   */
  async addRecommendation(index: number) {
    const card = this.recommendationCards.nth(index);
    const addButton = card.locator('.btn-recommendation');
    await addButton.click();
  }

  /**
   * Agrega un producto recomendado por su nombre
   * @param name - Nombre del producto
   */
  async addRecommendationByName(name: string) {
    const card = this.recommendationCards.filter({ hasText: name });
    await card.locator('.btn-recommendation').click();
  }

  /**
   * Espera a que aparezca una notificación y verifica su contenido
   * @param message - Texto esperado en la notificación
   * @param type - Tipo de notificación (success, warning, info)
   */
  async expectNotification(message: string, type: 'success' | 'warning' | 'info' = 'success') {
    await expect(this.notification).toBeVisible();
    await expect(this.notification).toContainText(message);
    await expect(this.notification).toHaveClass(new RegExp(`alert-${type}`));
  }

  /**
   * Obtiene la cantidad mostrada de un item específico
   * @param index - Índice del item
   * @returns Número de cantidad
   */
  async getItemQuantity(index: number): Promise<number> {
    const item = this.getItemByIndex(index);
    const text = await item.quantity.innerText();
    return parseInt(text, 10);
  }

  /**
   * Limpia el carrito eliminando el localStorage
   * Útil para setup/teardown en pruebas
   */
  async clearCart() {
    await this.page.evaluate(() => {
      localStorage.removeItem('ktmCart');
      localStorage.removeItem('ktmDiscount');
    });
    await this.page.reload();
  }

  /**
   * Inserta items directamente en el localStorage para pre-cargar el carrito
   * Útil para preparar el estado inicial de una prueba
   * @param items - Array de items a agregar al carrito
   */
  async seedCart(items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    icon: string;
    type: 'producto' | 'servicio';
  }>) {
    await this.page.evaluate((cartItems) => {
      localStorage.setItem('ktmCart', JSON.stringify(cartItems));
    }, items);
    await this.page.reload();
  }

  /**
   * Intercepta y mockea las llamadas al backend relacionadas con el carrito
   * Similar al mockSuccessfulLogin del LoginPage
   */
  async mockCartApis() {
    // Mock de productos
    await this.page.route('**/api/productos**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de servicios
    await this.page.route('**/api/servicios**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de motos del cliente
    await this.page.route('**/api/motos**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de creación de orden de servicio (checkout exitoso)
    await this.page.route('**/api/ordenes_servicio/insertar**', route => route.fulfill({
      status: 201,
      json: {
        success: true,
        message: 'Orden de servicio creada exitosamente'
      }
    }));
  }

  /**
   * Mockea motos específicas para el checkout
   * @param motos - Array de motos a devolver en la API
   */
  async mockClientMotos(motos: Array<{
    id_moto: number;
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
    id_cliente: number;
  }>) {
    await this.page.route('**/api/motos**', route => route.fulfill({
      status: 200,
      json: { data: motos }
    }));
  }

  /**
   * Mockea productos recomendados para la sección inferior
   * @param products - Array de productos a mostrar como recomendaciones
   */
  async mockRecommendedProducts(products: Array<{
    ID_PRODUCTOS?: number;
    ID_SERVICIOS?: number;
    Nombre: string;
    Precio: number;
    categoria_nombre: string;
  }>) {
    const productos = products.filter(p => p.ID_PRODUCTOS);
    const servicios = products.filter(p => p.ID_SERVICIOS);

    await this.page.route('**/api/productos**', route => route.fulfill({
      status: 200,
      json: { data: productos }
    }));

    await this.page.route('**/api/servicios**', route => route.fulfill({
      status: 200,
      json: { data: servicios }
    }));
  }
}// Importamos los tipos necesarios desde Playwright
import { Page, Locator, expect } from '@playwright/test';

/**
 * Clase CartPage que implementa el patrón Page Object Model (POM)
 * Encapsula toda la lógica y los elementos de la página de carrito de compras,
 * facilitando la escritura de pruebas E2E para el flujo de compra.
 */
export class CartPage {
  readonly page: Page;

  // === LOCALIZADORES PRINCIPALES ===
  // Cabecera del carrito
  readonly cartTitle: Locator;
  readonly cartSubtitle: Locator;

  // Lista de items del carrito
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;

  // Resumen del pedido
  readonly cartSummary: Locator;
  readonly summaryRows: Locator;
  readonly totalValue: Locator;

  // Botones de acción principal
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  // Notificaciones
  readonly notification: Locator;

  // Sección de recomendaciones
  readonly recommendationsGrid: Locator;
  readonly recommendationCards: Locator;

  // === MODALES ===
  readonly modalOverlay: Locator;
  readonly modalContent: Locator;
  readonly modalTitle: Locator;

  // Modal de eliminación
  readonly deleteModalConfirmButton: Locator;
  readonly deleteModalCancelButton: Locator;

  // Modal de checkout
  readonly checkoutModalNextButton: Locator;
  readonly checkoutModalBackButton: Locator;
  readonly checkoutModalSaveOrderButton: Locator;

  // Formulario de moto en el checkout
  readonly motoCards: Locator;
  readonly newMotoCard: Locator;
  readonly placaInput: Locator;
  readonly marcaInput: Locator;
  readonly modeloInput: Locator;
  readonly cilindrajeInput: Locator;
  readonly kilometrajeInput: Locator;

  /**
   * Constructor de la clase CartPage
   * @param page - Instancia de la página de Playwright
   */
  constructor(page: Page) {
    this.page = page;

    // === Inicialización de localizadores principales ===
    this.cartTitle = page.locator('.cart-title');
    this.cartSubtitle = page.locator('.cart-subtitle');

    // Lista de items dentro del carrito
    this.cartItems = page.locator('.cart-item');
    this.emptyCartMessage = page.locator('.empty-cart');

    // Resumen del pedido (panel derecho)
    this.cartSummary = page.locator('.cart-summary');
    this.summaryRows = page.locator('.summary-row');
    this.totalValue = page.locator('.total-value');

    // Botones principales del carrito
    this.checkoutButton = page.locator('.btn-checkout');
    this.continueShoppingButton = page.locator('.btn-continue').first();

    // Sistema de notificaciones toast
    this.notification = page.locator('.cart-notification');

    // Sección de productos recomendados
    this.recommendationsGrid = page.locator('.recommendations-grid');
    this.recommendationCards = page.locator('.recommendation-card');

    // === Inicialización de modales ===
    this.modalOverlay = page.locator('.modal-overlay');
    this.modalContent = page.locator('.modal-content');
    this.modalTitle = page.locator('.modal-title');

    // Botones del modal de confirmación de eliminación
    // Usamos .first() para el botón primario (eliminar) y .last() para cancelar
    this.deleteModalConfirmButton = page.locator('.modal-footer .btn-danger');
    this.deleteModalCancelButton = page.locator('.modal-footer .btn-secondary').first();

    // Botones del modal de checkout
    this.checkoutModalNextButton = page.locator('.modal-footer .btn-ktm');
    this.checkoutModalBackButton = page.locator('.modal-footer .btn-secondary').first();
    this.checkoutModalSaveOrderButton = page.locator('.modal-footer .btn-ktm');

    // === Localizadores del formulario de moto ===
    this.motoCards = page.locator('.moto-card:not(.moto-card--new)');
    this.newMotoCard = page.locator('.moto-card--new');
    this.placaInput = page.locator('.moto-form-input').nth(0);
    this.marcaInput = page.locator('.moto-form-input').nth(1);
    this.modeloInput = page.locator('.moto-form-input').nth(2);
    this.cilindrajeInput = page.locator('.moto-form-input').nth(3);
    this.kilometrajeInput = page.locator('.moto-form-input').nth(4);
  }

  /**
   * Navega a la página del carrito
   */
  async navigate() {
    await this.page.goto('/cart');
  }

  /**
   * Verifica que la página del carrito se haya cargado correctamente
   */
  async expectLoaded() {
    await expect(this.cartTitle).toBeVisible();
    await expect(this.cartTitle).toContainText('TU CARRITO DE COMPRAS');
  }

  /**
   * Obtiene la cantidad total de items en el carrito
   * @returns Número de items visibles
   */
  async getItemsCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Verifica si el carrito está vacío
   * @returns true si el carrito muestra el mensaje de vacío
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * Obtiene un item específico del carrito por su índice
   * @param index - Índice del item (0-based)
   * @returns Objeto con los localizadores del item
   */
  getItemByIndex(index: number) {
    const item = this.cartItems.nth(index);
    return {
      container: item,
      title: item.locator('.item-title'),
      category: item.locator('.item-category'),
      description: item.locator('.item-description'),
      quantity: item.locator('.qty-value'),
      subtotal: item.locator('.item-subtotal'),
      minusButton: item.locator('.qty-btn.minus'),
      plusButton: item.locator('.qty-btn.plus'),
      deleteButton: item.locator('.delete-btn'),
    };
  }

  /**
   * Obtiene un item del carrito por su nombre
   * @param name - Nombre del producto
   * @returns Objeto con los localizadores del item
   */
  getItemByName(name: string) {
    const item = this.cartItems.filter({ hasText: name });
    return {
      container: item,
      title: item.locator('.item-title'),
      category: item.locator('.item-category'),
      quantity: item.locator('.qty-value'),
      subtotal: item.locator('.item-subtotal'),
      minusButton: item.locator('.qty-btn.minus'),
      plusButton: item.locator('.qty-btn.plus'),
      deleteButton: item.locator('.delete-btn'),
    };
  }

  /**
   * Incrementa la cantidad de un item en el carrito
   * @param index - Índice del item
   */
  async increaseQuantity(index: number) {
    const item = this.getItemByIndex(index);
    await item.plusButton.click();
  }

  /**
   * Decrementa la cantidad de un item en el carrito
   * Si la cantidad llega a 0, se abre el modal de confirmación de eliminación
   * @param index - Índice del item
   */
  async decreaseQuantity(index: number) {
    const item = this.getItemByIndex(index);
    await item.minusButton.click();
  }

  /**
   * Elimina un item del carrito directamente desde el botón de basura
   * Abre el modal de confirmación
   * @param index - Índice del item a eliminar
   */
  async deleteItem(index: number) {
    const item = this.getItemByIndex(index);
    await item.deleteButton.click();
  }

  /**
   * Confirma la eliminación en el modal
   */
  async confirmDelete() {
    await expect(this.modalOverlay).toBeVisible();
    await this.deleteModalConfirmButton.click();
    await expect(this.modalOverlay).not.toBeVisible();
  }

  /**
   * Cancela la eliminación en el modal
   */
  async cancelDelete() {
    await this.deleteModalCancelButton.click();
    await expect(this.modalOverlay).not.toBeVisible();
  }

  /**
   * Obtiene el valor total mostrado en el resumen del pedido
   * @returns String con el texto del total
   */
  async getTotalValue(): Promise<string> {
    return await this.totalValue.innerText();
  }

  /**
   * Hace clic en el botón "Proceder al Pago"
   * Abre el modal de checkout en su primer paso
   */
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await expect(this.modalOverlay).toBeVisible();
  }

  /**
   * Avanza al segundo paso del checkout (datos de la moto)
   */
  async goToMotoStep() {
    await this.checkoutModalNextButton.click();
    // Esperamos a que el título cambie al del paso 2
    await expect(this.modalTitle).toContainText('Datos de la Motocicleta');
  }

  /**
   * Selecciona una moto existente del usuario en el modal de checkout
   * @param index - Índice de la moto (0-based)
   */
  async selectMoto(index: number) {
    const moto = this.motoCards.nth(index);
    await moto.click();
    await expect(moto).toHaveClass(/moto-card--selected/);
  }

  /**
   * Selecciona la opción de registrar una nueva moto
   */
  async selectNewMoto() {
    await this.newMotoCard.click();
    await expect(this.newMotoCard).toHaveClass(/moto-card--selected/);
  }

  /**
   * Llena el formulario de nueva moto con los datos proporcionados
   * @param data - Datos de la moto
   */
  async fillNewMotoForm(data: {
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
  }) {
    await this.placaInput.fill(data.placa);
    await this.marcaInput.fill(data.marca);
    await this.modeloInput.fill(data.modelo);
    await this.cilindrajeInput.fill(data.cilindraje);
    await this.kilometrajeInput.fill(data.kilometraje);
  }

  /**
   * Guarda la orden de servicio (envía el checkout al backend)
   */
  async saveOrder() {
    await this.checkoutModalSaveOrderButton.click();
  }

  /**
   * Flujo completo de checkout con una moto existente
   */
  async checkoutWithExistingMoto(motoIndex: number = 0) {
    await this.proceedToCheckout();
    await this.goToMotoStep();
    await this.selectMoto(motoIndex);
    await this.saveOrder();
  }

  /**
   * Flujo completo de checkout registrando una nueva moto
   */
  async checkoutWithNewMoto(motoData: {
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
  }) {
    await this.proceedToCheckout();
    await this.goToMotoStep();
    await this.selectNewMoto();
    await this.fillNewMotoForm(motoData);
    await this.saveOrder();
  }

  /**
   * Agrega un producto desde la sección de recomendaciones
   * @param index - Índice del producto recomendado (0-based)
   */
  async addRecommendation(index: number) {
    const card = this.recommendationCards.nth(index);
    const addButton = card.locator('.btn-recommendation');
    await addButton.click();
  }

  /**
   * Agrega un producto recomendado por su nombre
   * @param name - Nombre del producto
   */
  async addRecommendationByName(name: string) {
    const card = this.recommendationCards.filter({ hasText: name });
    await card.locator('.btn-recommendation').click();
  }

  /**
   * Espera a que aparezca una notificación y verifica su contenido
   * @param message - Texto esperado en la notificación
   * @param type - Tipo de notificación (success, warning, info)
   */
  async expectNotification(message: string, type: 'success' | 'warning' | 'info' = 'success') {
    await expect(this.notification).toBeVisible();
    await expect(this.notification).toContainText(message);
    await expect(this.notification).toHaveClass(new RegExp(`alert-${type}`));
  }

  /**
   * Obtiene la cantidad mostrada de un item específico
   * @param index - Índice del item
   * @returns Número de cantidad
   */
  async getItemQuantity(index: number): Promise<number> {
    const item = this.getItemByIndex(index);
    const text = await item.quantity.innerText();
    return parseInt(text, 10);
  }

  /**
   * Limpia el carrito eliminando el localStorage
   * Útil para setup/teardown en pruebas
   */
  async clearCart() {
    await this.page.evaluate(() => {
      localStorage.removeItem('ktmCart');
      localStorage.removeItem('ktmDiscount');
    });
    await this.page.reload();
  }

  /**
   * Inserta items directamente en el localStorage para pre-cargar el carrito
   * Útil para preparar el estado inicial de una prueba
   * @param items - Array de items a agregar al carrito
   */
  async seedCart(items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    icon: string;
    type: 'producto' | 'servicio';
  }>) {
    await this.page.evaluate((cartItems) => {
      localStorage.setItem('ktmCart', JSON.stringify(cartItems));
    }, items);
    await this.page.reload();
  }

  /**
   * Intercepta y mockea las llamadas al backend relacionadas con el carrito
   * Similar al mockSuccessfulLogin del LoginPage
   */
  async mockCartApis() {
    // Mock de productos
    await this.page.route('**/api/productos**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de servicios
    await this.page.route('**/api/servicios**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de motos del cliente
    await this.page.route('**/api/motos**', route => route.fulfill({
      status: 200,
      json: { data: [] }
    }));

    // Mock de creación de orden de servicio (checkout exitoso)
    await this.page.route('**/api/ordenes_servicio/insertar**', route => route.fulfill({
      status: 201,
      json: {
        success: true,
        message: 'Orden de servicio creada exitosamente'
      }
    }));
  }

  /**
   * Mockea motos específicas para el checkout
   * @param motos - Array de motos a devolver en la API
   */
  async mockClientMotos(motos: Array<{
    id_moto: number;
    placa: string;
    marca: string;
    modelo: string;
    cilindraje: string;
    kilometraje: string;
    id_cliente: number;
  }>) {
    await this.page.route('**/api/motos**', route => route.fulfill({
      status: 200,
      json: { data: motos }
    }));
  }

  /**
   * Mockea productos recomendados para la sección inferior
   * @param products - Array de productos a mostrar como recomendaciones
   */
  async mockRecommendedProducts(products: Array<{
    ID_PRODUCTOS?: number;
    ID_SERVICIOS?: number;
    Nombre: string;
    Precio: number;
    categoria_nombre: string;
  }>) {
    const productos = products.filter(p => p.ID_PRODUCTOS);
    const servicios = products.filter(p => p.ID_SERVICIOS);

    await this.page.route('**/api/productos**', route => route.fulfill({
      status: 200,
      json: { data: productos }
    }));

    await this.page.route('**/api/servicios**', route => route.fulfill({
      status: 200,
      json: { data: servicios }
    }));
  }
}