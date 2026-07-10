import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerProductos } from '../services/producto.service';
import { obtenerServicios } from '../services/servicio.service';
import { ProductoPayload } from '../services/producto.service';
import { ServicioPayload } from '../services/servicio.service';
import './Cart.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  icon: string;
  description?: string;
  type: 'producto' | 'servicio';
}

interface CartProps {
  onCheckout?: (cartData: any) => void;
}

const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [deleteModalData, setDeleteModalData] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [products, setProducts] = useState<(ProductoPayload | ServicioPayload)[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const shippingCost = 9.99;
  const discountAmount = 30.0;
  const taxRate = 0.21;

  // Cargar carrito desde localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ktmCart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : Object.values(parsed));
      }
    } catch (e) {
      console.error(e);
    }

    const savedDiscount = localStorage.getItem('ktmDiscount');
    if (savedDiscount) setDiscountApplied(JSON.parse(savedDiscount));
    
    // Escuchar cambios en localStorage desde otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ktmCart' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCart(Array.isArray(parsed) ? parsed : Object.values(parsed));
        } catch (err) {}
      }
      if (e.key === 'ktmDiscount' && e.newValue) {
        setDiscountApplied(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cargar productos y servicios reales de la BD
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const [productosData, serviciosData] = await Promise.all([
          obtenerProductos(),
          obtenerServicios()
        ]);
        
        const extractArray = (resData: any) => {
          if (!resData) return [];
          if (Array.isArray(resData)) return resData;
          if (resData.data && Array.isArray(resData.data)) return resData.data;
          if (resData.productos && Array.isArray(resData.productos)) return resData.productos;
          if (resData.servicios && Array.isArray(resData.servicios)) return resData.servicios;
          return [];
        };

        const allProducts = [
          ...extractArray(productosData?.data),
          ...extractArray(serviciosData?.data)
        ];
        
        setProducts(allProducts);
      } catch (error) {
        console.error('Error cargando productos:', error);
        showNotification('Error al cargar productos disponibles', 'warning');
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // Guardar carrito en localStorage
  const saveCart = (updatedCart: CartItem[], discount: boolean = discountApplied) => {
    localStorage.setItem('ktmCart', JSON.stringify(updatedCart));
    localStorage.setItem('ktmDiscount', JSON.stringify(discount));
    setCart(updatedCart);
    setDiscountApplied(discount);
    
    // Disparar evento para actualizar otros componentes (ej: Navbar)
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Agregar al carrito
  const addToCart = (product: any) => {
    const isProducto = 'ID_PRODUCTOS' in product;
    const id = isProducto ? String(product.ID_PRODUCTOS) : String(product.ID_SERVICIOS);
    const name = product.Nombre;
    const price = Number(product.Precio);
    const category = product.categoria_nombre || 'Sin categoría';
    const type = isProducto ? 'producto' : 'servicio';
    
    const existingIndex = cart.findIndex(item => item.id === id);
    let newCart = [...cart];
    
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += 1;
    } else {
      const iconMap: { [key: string]: string } = {
        'aceite': 'droplet-half',
        'refrigerante': 'snow',
        'accesorio': 'lightbulb',
        'led': 'lightbulb',
        'limpieza': 'brush',
        'electricidad': 'battery-full',
        'batería': 'battery-full',
        'mantenimiento': 'wrench',
        'cadena': 'link',
        'chaqueta': 'shield',
        'casco': 'shield-exclamation',
      };
      
      const icon = Object.keys(iconMap).find(key => 
        category.toLowerCase().includes(key) || name.toLowerCase().includes(key)
      ) ? iconMap[Object.keys(iconMap).find(key => 
        category.toLowerCase().includes(key) || name.toLowerCase().includes(key)
      )!] : 'box';
      
      newCart.push({
        id,
        name,
        price,
        quantity: 1,
        category,
        icon,
        type,
        description: `${type === 'producto' ? 'Producto' : 'Servicio'} de ${category} para tu motocicleta KTM`,
      });
    }
    
    saveCart(newCart);
    showNotification(`${name} agregado al carrito`, 'success');
  };

  // Actualizar cantidad
  const updateQuantity = (id: string, change: number) => {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex >= 0) {
      const newCart = [...cart];
      newCart[itemIndex].quantity += change;
      
      if (newCart[itemIndex].quantity < 1) {
        setDeleteModalData({ id, name: newCart[itemIndex].name });
        setShowDeleteModal(true);
      } else {
        saveCart(newCart);
      }
    }
  };

  // Eliminar del carrito
  const removeFromCart = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    saveCart(newCart);
    setShowDeleteModal(false);
    showNotification('Producto eliminado', 'warning');
  };

  // Aplicar descuento
  const applyDiscount = () => {
    const code = promoCode.toUpperCase();
    if (code === 'KTM2024' || code === 'KTM2025') {
      saveCart(cart, true);
      showNotification('¡Descuento aplicado! -$30.00', 'success');
    } else {
      saveCart(cart, false);
      showNotification('Código no válido', 'warning');
    }
  };

  // Calcular totales
  const calculateTotals = () => {
    let subtotal = 0;
    let totalItems = 0;
    
    cart.forEach(item => {
      subtotal += item.price * item.quantity;
      totalItems += item.quantity;
    });
    
    const tax = subtotal * taxRate;
    const discount = discountApplied ? discountAmount : 0;
    const total = subtotal > 0 ? subtotal + shippingCost - discount + tax : 0;
    
    return { subtotal, tax, discount, total: Math.max(0, total), totalItems };
  };

  const totals = calculateTotals();

  // Procesar checkout
  const processCheckout = () => {
    if (cart.length === 0) {
      showNotification('El carrito está vacío', 'warning');
      return;
    }
    
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutDiscount', JSON.stringify(discountApplied));
    
    if (onCheckout) {
      onCheckout({ cart, discountApplied, totals });
    } else {
      showNotification('Redirigiendo al checkout...', 'success');
      // window.location.href = '/checkout';
    }
    
    setShowCheckoutModal(false);
  };

  return (
    <div className="cart-page">
      {/* Notificación */}
      {notification && (
        <div className={`cart-notification alert-${notification.type}`}>
          <i className={`bi bi-${notification.type === 'success' ? 'check-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}`}></i>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Contenedor principal */}
      <div className="cart-container">
        {/* Encabezado */}
        <div className="cart-header">
          <h1 className="cart-title">TU CARRITO DE COMPRAS</h1>
          <p className="cart-subtitle">Revisa y gestiona los servicios seleccionados para tu motocicleta KTM</p>
          <div className="cart-title-line"></div>
        </div>

        <div className="cart-layout">
          {/* Lista de productos */}
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon">
                  <i className="bi bi-cart-x"></i>
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>No has agregado productos al carrito. ¡Explora nuestros servicios KTM!</p>
                <Link to="/" className="cart-btn btn-continue">
                  <i className="bi bi-arrow-left"></i>
                  Ver Servicios
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item" data-id={item.id}>
                  <div className="item-image">
                    <i className={`bi bi-${item.icon}`}></i>
                  </div>

                  <div className="item-details">
                    <div className="item-header">
                      <h4 className="item-title">{item.name}</h4>
                      <div className="item-info-row">
                        <span className="item-category">{item.category}</span>
                      </div>
                    </div>

                    <p className="item-description">{item.description}</p>

                    <div className="item-footer">
                      <div className="quantity-control">
                        <button
                          className="qty-btn minus"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn plus"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      <div className="item-subtotal">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => {
                      setDeleteModalData({ id: item.id, name: item.name });
                      setShowDeleteModal(true);
                    }}
                    title="Eliminar"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Resumen del pedido */}
          {cart.length > 0 && (
            <div className="cart-summary">
              <h3 className="summary-title">RESUMEN DEL PEDIDO</h3>

              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Envío:</span>
                  <span className="summary-value">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Descuento:</span>
                  <span className="summary-value" style={{ color: 'var(--ktm-orange)' }}>
                    -${totals.discount.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Impuestos (21%):</span>
                  <span className="summary-value">${totals.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-total">
                <span className="total-label">TOTAL</span>
                <span className="total-value">${totals.total.toFixed(2)}</span>
              </div>

              <div className="summary-actions">
                <button
                  className="cart-btn btn-checkout"
                  onClick={() => setShowCheckoutModal(true)}
                >
                  <i className="bi bi-credit-card"></i>
                  PROCEDER AL PAGO
                </button>
                <Link to="/" className="cart-btn btn-continue">
                  <i className="bi bi-arrow-left"></i>
                  SEGUIR COMPRANDO
                </Link>
              </div>

              <div className="summary-promo">
                <div className="promo-title">
                  <i className="bi bi-tag"></i>
                  ¿Tienes un código de descuento?
                </div>
                <div className="promo-form">
                  <input
                    type="text"
                    className="promo-input"
                    id="promoCode"
                    name="promoCode"
                    placeholder="Ingresa tu código"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyDiscount()}
                  />
                  <button className="btn-promo" onClick={applyDiscount}>
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recomendaciones de productos */}
        {cart.length > 0 && (
          <div className="cart-recommendations">
            <h3 className="recommendations-title">PRODUCTOS Y SERVICIOS DISPONIBLES</h3>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', color: 'var(--ktm-orange)', marginBottom: '10px', display: 'block' }}></i>
                <p>Cargando productos disponibles...</p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p>No hay productos disponibles en este momento</p>
              </div>
            ) : (
              <div className="recommendations-grid">
                {products.slice(0, 6).map((product) => {
                  const isProducto = 'ID_PRODUCTOS' in product;
                  const id = isProducto ? String(product.ID_PRODUCTOS) : String(product.ID_SERVICIOS);
                  const name = product.Nombre;
                  const price = Number(product.Precio);
                  const category = product.categoria_nombre || (isProducto ? 'Producto' : 'Servicio');
                  
                  const iconMap: { [key: string]: string } = {
                    'aceite': 'droplet-half',
                    'refrigerante': 'snow',
                    'accesorio': 'lightbulb',
                    'led': 'lightbulb',
                    'limpieza': 'brush',
                    'electricidad': 'battery-full',
                    'batería': 'battery-full',
                    'mantenimiento': 'wrench',
                    'cadena': 'link',
                    'chaqueta': 'shield',
                    'casco': 'shield-exclamation',
                    'diagnóstico': 'stethoscope',
                    'instalación': 'tools',
                    'reparación': 'hammer',
                  };
                  
                  const icon = Object.keys(iconMap).find(key => 
                    category.toLowerCase().includes(key) || name.toLowerCase().includes(key)
                  ) ? iconMap[Object.keys(iconMap).find(key => 
                    category.toLowerCase().includes(key) || name.toLowerCase().includes(key)
                  )!] : 'box';

                  return (
                    <div key={id} className="recommendation-card">
                      <div className="recommendation-icon">
                        <i className={`bi bi-${icon}`}></i>
                      </div>
                      <h4 className="recommendation-name">{name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ktm-gray-light)', marginBottom: '10px' }}>
                        {category}
                      </p>
                      <div className="recommendation-price">${price.toFixed(2)}</div>
                      <button
                        className="btn-recommendation"
                        onClick={() => addToCart(product)}
                      >
                        <i className="bi bi-cart-plus"></i>
                        Agregar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Modal de eliminar producto */}
      {showDeleteModal && deleteModalData && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2"></i>Eliminar Producto
              </h5>
              <button
                className="btn-close-white"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center' }}>
                <i
                  className="bi bi-trash"
                  style={{ fontSize: '3rem', color: 'var(--ktm-orange)', marginBottom: '1rem', display: 'block' }}
                ></i>
                <p>¿Estás seguro de eliminar "{deleteModalData.name}" del carrito?</p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '1rem' }}>
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="bi bi-x-circle me-2"></i>Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => removeFromCart(deleteModalData.id)}
              >
                <i className="bi bi-trash me-2"></i>Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de checkout */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-credit-card me-2"></i>Proceder al Pago
              </h5>
              <button
                className="btn-close-white"
                onClick={() => setShowCheckoutModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <i
                  className="bi bi-cart-check"
                  style={{ fontSize: '3rem', color: 'var(--ktm-orange)', marginBottom: '1rem', display: 'block' }}
                ></i>
                <h5>¿Confirmar compra?</h5>
                <p style={{ color: '#aaa' }}>
                  Serás redirigido a la página de checkout para completar tus datos.
                </p>
              </div>

              <div className="checkout-summary">
                <h6 style={{ marginBottom: '1rem' }}>Resumen del pedido:</h6>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Productos:</span>
                  <span>{totals.totalItems}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Envío:</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span>Descuento:</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
                <hr style={{ borderColor: '#444', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>TOTAL:</span>
                  <span style={{ color: 'var(--ktm-orange)', fontSize: '1.2rem' }}>
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(13, 110, 253, 0.15)',
                  border: '1px solid rgba(13, 110, 253, 0.3)',
                  color: '#b8daff',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1rem',
                }}
              >
                <i className="bi bi-info-circle me-2"></i>
                <small>Recuerda que puedes aplicar códigos de descuento en la siguiente página.</small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCheckoutModal(false)}
              >
                <i className="bi bi-arrow-left me-2"></i>Seguir comprando
              </button>
              <button
                className="btn btn-ktm"
                onClick={processCheckout}
              >
                <i className="bi bi-arrow-right me-2"></i>Continuar al pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
