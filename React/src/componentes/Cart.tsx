import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerProductos } from '../services/producto.service';
import { obtenerServicios } from '../services/servicio.service';
import { ProductoPayload } from '../services/producto.service';
import { ServicioPayload } from '../services/servicio.service';
import { obtenerMotos, MotoRecord } from '../services/moto.service';

import { apiClient } from '../config/axios';
import './Cart.css';
//
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

interface CartProps { }

const Cart: React.FC<CartProps> = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [deleteModalData, setDeleteModalData] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [products, setProducts] = useState<(ProductoPayload | ServicioPayload)[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [savingOrder, setSavingOrder] = useState(false);
  const [clientMotos, setClientMotos] = useState<MotoRecord[]>([]);
  const [loadingMotos, setLoadingMotos] = useState(false);
  const [selectedMotoId, setSelectedMotoId] = useState<string>('new');
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>('');

  const [motoForm, setMotoForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    cilindraje: '',
    kilometraje: '',
  });

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
        } catch (err) { }
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
    const rawId = isProducto ? String(product.ID_PRODUCTOS) : String(product.ID_SERVICIOS);
    const type = isProducto ? 'producto' : 'servicio';
    const id = `${type === 'producto' ? 'prod' : 'serv'}_${rawId}`;
    const name = product.Nombre;
    const price = Number(isProducto ? product.precio_venta : product.Precio);
    const category = product.categoria_nombre || 'Sin categoría';

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

  // Verificar autenticación antes de proceder al pago
  const handleCheckoutClick = async () => {
    const isAuthenticated = Boolean(localStorage.getItem('user_token'));
    if (!isAuthenticated) {
      showNotification('Debes iniciar sesión para proceder al pago', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Load motos — el user_id en localStorage es el numero_documento,
    // pero la tabla motos usa id_cliente que apunta a usuarios.id_usuario.
    // Necesitamos obtener el id_usuario del cliente logueado.
    try {
      setLoadingMotos(true);
      const userDocumento = localStorage.getItem('user_id');
      const realClientId = String(userDocumento);

      console.log('🏍️ [MOTOS] ID Cliente actual:', realClientId);

      // 1) Obtener motos (solo necesitamos las motos)
      const motosRes = await obtenerMotos();

      // 2) Extraer array de motos
      const rawMotos = motosRes.data;
      let motosArr: any[] = [];
      if (Array.isArray(rawMotos)) motosArr = rawMotos;
      else if (rawMotos?.data && Array.isArray(rawMotos.data)) motosArr = rawMotos.data;
      else if (rawMotos?.motos && Array.isArray(rawMotos.motos)) motosArr = rawMotos.motos;
      else if (rawMotos?.result && Array.isArray(rawMotos.result)) motosArr = rawMotos.result;

      // 3) Filtrar motos del cliente (motos.id_cliente === usuarios.id_usuario)
      const userMotos = motosArr.filter((m: any) => {
        const motoClientId = String(m.id_cliente ?? m.ID_CLIENTES ?? '');
        return motoClientId === realClientId;
      });

      console.log('🏍️ [MOTOS] Motos encontradas:', userMotos.length, userMotos);

      setClientMotos(userMotos);

      if (userMotos.length > 0) {
        const firstId = String(userMotos[0].id_moto ?? userMotos[0].ID_MOTOS ?? '');
        setSelectedMotoId(firstId);
      } else {
        setSelectedMotoId('new');
      }
    } catch (e) {
      console.error('Error al cargar motos:', e);
      setSelectedMotoId('new');
    } finally {
      setLoadingMotos(false);
    }

    setShowCheckoutModal(true);
  };

  // Procesar checkout
  const processCheckout = async () => {
    if (cart.length === 0) {
      showNotification('El carrito está vacío', 'warning');
      return;
    }

    // Step 1 → avanzar al formulario de moto
    if (checkoutStep === 1) {
      setCheckoutStep(2);
      return;
    }

    // Step 2 → validar formulario y enviar al backend
    if (selectedMotoId === 'new' && (!motoForm.placa || !motoForm.marca || !motoForm.modelo || !motoForm.cilindraje || !motoForm.kilometraje)) {
      showNotification('Por favor completa todos los campos de la moto', 'warning');
      return;
    }

    if (!selectedMetodoPago) {
      showNotification('Por favor selecciona un método de pago', 'warning');
      return;
    }

    setSavingOrder(true);
    try {
      const detalles = cart.map(item => {
        const isProducto = (item as any).ID_PRODUCTOS !== undefined;
        return {
          ID_SERVICIOS: !isProducto ? parseInt(item.id, 10) : null,
          ID_PRODUCTOS: isProducto ? parseInt(item.id, 10) : null,
          Garantia: null,
          cantidad: item.quantity,
          precio_unitario: item.price,
          Precio: item.price * item.quantity,
        };
      });

      const body = {
        moto: selectedMotoId === 'new' ? motoForm : undefined,
        id_moto: selectedMotoId !== 'new' ? Number(selectedMotoId) : undefined,
        detalles,
        total: totals.subtotal,
        metodo_pago: selectedMetodoPago,
        observaciones: '',
      };

      const res = await apiClient.post('/ordenes_servicio/insertar', body);

      const data = res.data;

      if (data.success || data.message?.includes('creada') || res.status === 200 || res.status === 201) {
        // Limpiar carrito
        setCart([]);
        localStorage.removeItem('ktmCart');
        setShowCheckoutModal(false);
        setCheckoutStep(1);
        setMotoForm({ placa: '', marca: '', modelo: '', cilindraje: '', kilometraje: '' });
        setSelectedMetodoPago('');
        showNotification('¡Orden de servicio creada exitosamente!', 'success');
        setTimeout(() => navigate('/cliente/dashboard'), 2000);
      } else {
        const backendError = data.error || data.message || 'No se pudo guardar la orden';
        showNotification(`Error: ${backendError}`, 'warning');
      }
    } catch (error: any) {
      console.error('Error al guardar orden:', error);
      showNotification('Error de conexión con el servidor', 'warning');
    } finally {
      setSavingOrder(false);
    }
  };

  const userRole = localStorage.getItem('user_role');
  const clienteNombre = localStorage.getItem('user_name') || 'Cliente';

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    navigate('/login');
  };

  return (
    <div className="cart-page">
      {/* Cabecera del Dashboard de Cliente (Solo visible si es cliente) */}
      {userRole === 'cliente' && (
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '15px 20px', background: 'var(--ktm-dark-card)', borderBottom: '1px solid #333', marginBottom: '20px' }}>
          <div>
            <h1 className="dashboard-title" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ktm-orange)' }}>Bienvenido, {clienteNombre}</h1>
            <p className="dashboard-subtitle" style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>Panel de Control del Cliente</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => navigate('/cliente/dashboard')} style={{
              background: '#ff6600', border: '2px solid #ff6600', color: '#fff',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
            }}>
              <i className="bi bi-arrow-left"></i> Volver al Dashboard
            </button>
            <button onClick={handleLogout} style={{
              background: 'transparent', border: '2px solid #ff6600', color: '#ff6600',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
            }}>
              <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
            </button>
          </div>
        </div>
      )}

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
                        ${(item.price * item.quantity).toLocaleString('es-CO')} COP
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
                {cart.map((item) => (
                  <div className="summary-row" key={`summary-${item.id}`}>
                    <span className="summary-label">
                      {item.name} <span style={{ color: 'var(--ktm-gray-light)', fontSize: '0.9rem' }}>x{item.quantity}</span>
                    </span>
                    <span className="summary-value">${(item.price * item.quantity).toLocaleString('es-CO')} COP</span>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <span className="total-label">TOTAL</span>
                <span className="total-value">
                  ${totals.subtotal.toLocaleString('es-CO')}
                  <span className="total-currency">COP</span>
                </span>
              </div>

              <div className="summary-actions">
                <button
                  className="cart-btn btn-checkout"
                  onClick={handleCheckoutClick}
                >
                  <i className="bi bi-credit-card"></i>
                  PROCEDER AL PAGO
                </button>
                <Link to="/" className="cart-btn btn-continue">
                  <i className="bi bi-arrow-left"></i>
                  SEGUIR COMPRANDO
                </Link>
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
                  const rawId = isProducto ? String((product as ProductoPayload).ID_PRODUCTOS) : String((product as ServicioPayload).ID_SERVICIOS);
                  const id = `${isProducto ? 'prod' : 'serv'}_${rawId}`;
                  const name = product.Nombre;
                  const price = Number(isProducto ? (product as ProductoPayload).precio_venta : (product as ServicioPayload).Precio);
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
                      <div className="recommendation-price">${price.toLocaleString('es-CO')} COP</div>
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
        <div className="modal-overlay" onClick={() => { setShowCheckoutModal(false); setCheckoutStep(1); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: checkoutStep === 2 ? '520px' : undefined }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`bi bi-${checkoutStep === 1 ? 'credit-card' : 'bicycle'} me-2`}></i>
                {checkoutStep === 1 ? 'Proceder al Pago' : 'Datos de la Motocicleta'}
              </h5>
              <button
                className="btn-close-white"
                onClick={() => { setShowCheckoutModal(false); setCheckoutStep(1); }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {checkoutStep === 1 ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <i
                      className="bi bi-cart-check"
                      style={{ fontSize: '3rem', color: 'var(--ktm-orange)', marginBottom: '1rem', display: 'block' }}
                    ></i>
                    <h5>¿Confirmar compra?</h5>
                    <p style={{ color: '#aaa' }}>
                      En el siguiente paso ingresarás los datos de tu motocicleta.
                    </p>
                  </div>

                  <div className="checkout-summary">
                    <h6 style={{ marginBottom: '1rem' }}>Resumen del pedido:</h6>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Productos:</span>
                      <span>{totals.totalItems}</span>
                    </div>
                    {cart.map((item) => (
                      <div key={`checkout-${item.id}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toLocaleString('es-CO')} COP</span>
                      </div>
                    ))}
                    <hr style={{ borderColor: '#444', margin: '1rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>TOTAL:</span>
                      <span style={{ color: 'var(--ktm-orange)', fontSize: '1.2rem' }}>
                        ${totals.subtotal.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <i
                      className="bi bi-bicycle"
                      style={{ fontSize: '3rem', color: 'var(--ktm-orange)', marginBottom: '0.5rem', display: 'block' }}
                    ></i>
                    <h5>{clientMotos.length > 0 ? 'Selecciona tu moto' : 'Registra tu moto'}</h5>
                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                      {clientMotos.length > 0
                        ? 'Elige la motocicleta para esta orden de servicio.'
                        : 'Estos datos quedarán asociados a tu orden de servicio.'}
                    </p>
                  </div>

                  <div className="moto-form">
                    {loadingMotos ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#888' }}>
                        <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: 'var(--ktm-orange)' }}></i>
                        Cargando tus motos...
                      </div>
                    ) : (
                      <>
                        {/* Moto Cards Grid */}
                        {(clientMotos.length > 0 || selectedMotoId !== 'new') && (
                          <div className="moto-cards-grid">
                            {clientMotos.map((m: any) => {
                              const motoId = String(m.id_moto || m.ID_MOTOS);
                              const isSelected = selectedMotoId === motoId;
                              const placa = m.placa || m.Placa || '---';
                              const marca = m.marca || m.Marca || '---';
                              const modelo = m.modelo || m.Modelo || '---';
                              const cilindraje = m.cilindraje || m.Cilindraje || '---';
                              const kilometraje = m.kilometraje || m.Kilometraje || m.Recorrido || '---';

                              return (
                                <div
                                  key={motoId}
                                  className={`moto-card ${isSelected ? 'moto-card--selected' : ''}`}
                                  onClick={() => setSelectedMotoId(motoId)}
                                >
                                  <div className="moto-card__check">
                                    <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                  </div>
                                  <div className="moto-card__icon">
                                    <i className="bi bi-bicycle"></i>
                                  </div>
                                  <div className="moto-card__placa">{placa}</div>
                                  <div className="moto-card__brand">{marca} {modelo}</div>
                                  <div className="moto-card__specs">
                                    <span><i className="bi bi-speedometer2"></i> {cilindraje}{String(cilindraje).includes('cc') ? '' : 'cc'}</span>
                                    <span><i className="bi bi-signpost"></i> {Number(kilometraje).toLocaleString('es-CO')} km</span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Card para agregar nueva moto */}
                            <div
                              className={`moto-card moto-card--new ${selectedMotoId === 'new' ? 'moto-card--selected' : ''}`}
                              onClick={() => setSelectedMotoId('new')}
                            >
                              <div className="moto-card__check">
                                <i className={`bi ${selectedMotoId === 'new' ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                              </div>
                              <div className="moto-card__icon moto-card__icon--add">
                                <i className="bi bi-plus-lg"></i>
                              </div>
                              <div className="moto-card__placa">Nueva Moto</div>
                              <div className="moto-card__brand" style={{ color: '#888' }}>Registrar una nueva</div>
                            </div>
                          </div>
                        )}

                        {/* Formulario de nueva moto (solo si se elige 'new') */}
                        {selectedMotoId === 'new' && (
                          <div className="moto-new-form" style={{ marginTop: clientMotos.length > 0 ? '1.2rem' : 0 }}>
                            {clientMotos.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#aaa', fontSize: '0.85rem' }}>
                                <i className="bi bi-info-circle" style={{ color: 'var(--ktm-orange)' }}></i>
                                Completa los datos de tu nueva motocicleta
                              </div>
                            )}
                            <div className="moto-form-group">
                              <label className="moto-form-label">
                                <i className="bi bi-card-text"></i> Placa
                              </label>
                              <input
                                type="text"
                                className="moto-form-input"
                                placeholder="Ej: ABC123"
                                value={motoForm.placa}
                                onChange={(e) => setMotoForm({ ...motoForm, placa: e.target.value.toUpperCase() })}
                                maxLength={7}
                              />
                            </div>
                            <div className="moto-form-group">
                              <label className="moto-form-label">
                                <i className="bi bi-building"></i> Marca
                              </label>
                              <input
                                type="text"
                                className="moto-form-input"
                                placeholder="Ej: KTM"
                                value={motoForm.marca}
                                onChange={(e) => setMotoForm({ ...motoForm, marca: e.target.value })}
                              />
                            </div>
                            <div className="moto-form-group">
                              <label className="moto-form-label">
                                <i className="bi bi-tag"></i> Modelo
                              </label>
                              <input
                                type="text"
                                className="moto-form-input"
                                placeholder="Ej: Duke 390"
                                value={motoForm.modelo}
                                onChange={(e) => setMotoForm({ ...motoForm, modelo: e.target.value })}
                              />
                            </div>
                            <div className="moto-form-row">
                              <div className="moto-form-group">
                                <label className="moto-form-label">
                                  <i className="bi bi-speedometer2"></i> Cilindraje
                                </label>
                                <input
                                  type="text"
                                  className="moto-form-input"
                                  placeholder="Ej: 373cc"
                                  value={motoForm.cilindraje}
                                  onChange={(e) => setMotoForm({ ...motoForm, cilindraje: e.target.value })}
                                />
                              </div>
                              <div className="moto-form-group">
                                <label className="moto-form-label">
                                  <i className="bi bi-signpost"></i> Kilometraje
                                </label>
                                <input
                                  type="text"
                                  className="moto-form-input"
                                  placeholder="Ej: 15000"
                                  value={motoForm.kilometraje}
                                  onChange={(e) => setMotoForm({ ...motoForm, kilometraje: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Moto seleccionada info */}
                  {selectedMotoId !== 'new' && clientMotos.length > 0 && (() => {
                    const sel = clientMotos.find((m: any) => String(m.id_moto || m.ID_MOTOS) === selectedMotoId);
                    if (!sel) return null;
                    return (
                      <div className="moto-selected-info">
                        <i className="bi bi-check-circle-fill" style={{ color: 'var(--ktm-orange)' }}></i>
                        <span>Moto seleccionada: <strong>{(sel as any).placa || (sel as any).Placa}</strong> — {(sel as any).marca || (sel as any).Marca} {(sel as any).modelo || (sel as any).Modelo}</span>
                      </div>
                    );
                  })()}

                  {/* ── Selector de Método de Pago ── */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                      <i className="bi bi-credit-card-2-front" style={{ color: 'var(--ktm-orange)', fontSize: '1.2rem' }}></i>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>Método de Pago</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'efectivo', label: 'Efectivo', icon: 'bi-cash-stack' },
                        { id: 'tarjeta', label: 'Tarjeta', icon: 'bi-credit-card' },
                        { id: 'transferencia', label: 'Transferencia', icon: 'bi-bank' },
                      ].map(metodo => (
                        <div
                          key={metodo.id}
                          onClick={() => setSelectedMetodoPago(metodo.id)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '6px', padding: '14px 8px', borderRadius: '12px', cursor: 'pointer',
                            border: selectedMetodoPago === metodo.id ? '2px solid var(--ktm-orange)' : '2px solid #333',
                            background: selectedMetodoPago === metodo.id ? 'rgba(255, 102, 0, 0.1)' : '#1a1a2e',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <i className={`bi ${metodo.icon}`} style={{
                            fontSize: '1.5rem',
                            color: selectedMetodoPago === metodo.id ? 'var(--ktm-orange)' : '#888',
                          }}></i>
                          <span style={{
                            fontSize: '0.8rem', fontWeight: 600,
                            color: selectedMetodoPago === metodo.id ? '#fff' : '#888',
                          }}>{metodo.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="checkout-summary" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>TOTAL A PAGAR:</span>
                      <span style={{ color: 'var(--ktm-orange)', fontSize: '1.1rem' }}>
                        ${totals.subtotal.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {checkoutStep === 2 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCheckoutStep(1)}
                  disabled={savingOrder}
                >
                  <i className="bi bi-arrow-left me-2"></i>Volver
                </button>
              )}
              {checkoutStep === 1 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowCheckoutModal(false); setCheckoutStep(1); }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Seguir comprando
                </button>
              )}
              <button
                className="btn btn-ktm"
                onClick={processCheckout}
                disabled={savingOrder}
              >
                {savingOrder ? (
                  <><i className="bi bi-arrow-repeat me-2" style={{ animation: 'spin 1s linear infinite' }}></i>Guardando...</>
                ) : checkoutStep === 1 ? (
                  <><i className="bi bi-arrow-right me-2"></i>Continuar</>
                ) : (
                  <><i className="bi bi-check-circle me-2"></i>Guardar Orden</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
