import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './componentes/Navbar';
import AppRoutes from './routes/AppRoutes';
import { useCart } from './hooks/useCart';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { clearSession } from './services/auth.services';
import { Service, SearchSuggestion } from './types';

import { obtenerProductos } from './services/producto.service';
import { obtenerServicios } from './services/servicio.service';

function App() {
  const [productos, setProductos] = useState<Service[]>([]);
  const [servicios, setServicios] = useState<Service[]>([]);
  const { addToCart, cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const particlesRef = useRef<HTMLDivElement>(null);

  const hasSession = !!localStorage.getItem('user_token');

  // Inactividad (30 minutos = 1800000 ms)
  const handleInactivityTimeout = useCallback(() => {
    Swal.fire({
      title: 'Sesión expirada por inactividad',
      text: 'Tu sesión se cerró automáticamente por seguridad tras 30 minutos sin actividad.',
      icon: 'warning',
      confirmButtonColor: '#ff6600',
    }).then(() => {
      clearSession(true);
    });
  }, []);

  useInactivityTimer(1800000, handleInactivityTimeout, hasSession);

  // Escuchar evento global de sesión expirada para redirección fluida
  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  // Flags de rutas donde ocultar elementos
  const isLoginPage = location.pathname === '/login';
  const isRegistroPage = location.pathname === '/registro';
  const isForgotPasswordPage = location.pathname === '/forgot-password';
  const isResetPasswordPage = location.pathname.startsWith('/reset-password');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isTecnicoPage = location.pathname.startsWith('/tecnico');
  const isClientePage = location.pathname.startsWith('/cliente');
  const isCartPage = location.pathname === '/carrito';
  const userRole = localStorage.getItem('user_role');

  const hideNavbar = isLoginPage || isRegistroPage || isForgotPasswordPage
    || isResetPasswordPage || isAdminPage || isTecnicoPage || isClientePage
    || (isCartPage && userRole === 'cliente');

  // Cargar productos del backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await obtenerProductos();
        if (res && res.data) {
          let productosArray = [];
          if (Array.isArray(res.data)) {
            productosArray = res.data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).data)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            productosArray = (res.data as any).data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).productos)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            productosArray = (res.data as any).productos;
          }

          if (productosArray.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedProductos = productosArray.map((p: any) => ({
              id: `prod_${p.ID_PRODUCTOS}`,
              name: p.Nombre,
              category: p.categoria_nombre || 'Producto',
              price: Number(p.precio_venta ?? p.Precio_Venta ?? p.Precio ?? 0),
              description: `Producto de la marca ${p.Marca || 'KTM'}`,
              icon: 'bi-box-seam',
              ID_PRODUCTOS: p.ID_PRODUCTOS,
              type: 'producto'
            }));
            setProductos(mappedProductos);
          }
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };

    const fetchServicios = async () => {
      try {
        const res = await obtenerServicios();
        if (res && res.data) {
          let serviciosArray = [];
          if (Array.isArray(res.data)) {
            serviciosArray = res.data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).data)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            serviciosArray = (res.data as any).data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).servicios)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            serviciosArray = (res.data as any).servicios;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).result)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            serviciosArray = (res.data as any).result;
          }

          if (serviciosArray.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedServicios = serviciosArray.map((s: any) => ({
              id: `serv_${s.ID_SERVICIOS}`,
              name: s.Nombre,
              category: s.Categoria || 'Servicios Generales',
              price: Number(s.Precio || 0),
              description: `Servicio de ${s.Nombre}`,
              icon: 'bi-wrench',
              type: 'servicio'
            }));
            setServicios(mappedServicios);
          }
        }
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      }
    };

    fetchProductos();
    fetchServicios();
  }, []);

  // Efecto de partículas decorativas (solo en la tienda principal)
  useEffect(() => {
    const container = particlesRef.current;
    if (!container || hideNavbar || isCartPage) return;

    container.innerHTML = '';
    for (let i = 0; i < 30; i += 1) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${(window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295) * 100}%`;
      particle.style.top = `${(window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295) * 100}%`;
      particle.style.animation = `float ${5 + (window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295) * 10}s linear infinite`;
      container.appendChild(particle);
    }

    return () => { container.innerHTML = ''; };
  }, [hideNavbar, isCartPage, location.pathname]);

  // Filtrar sugerencias de búsqueda
  const filterSuggestions = (query: string): SearchSuggestion[] => {
    if (!query.trim()) return [];
    const dynamicProductSuggestions: SearchSuggestion[] = productos.map(p => ({
      id: p.id, name: p.name, category: p.category, icon: p.icon, price: p.price.toString()
    }));
    const dynamicServiceSuggestions: SearchSuggestion[] = servicios.map(s => ({
      id: s.id, name: s.name, category: s.category, icon: s.icon, price: s.price.toString()
    }));
    const allSuggestions = [...dynamicServiceSuggestions, ...dynamicProductSuggestions];
    return allSuggestions
      .filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const service = servicios.find(item => item.id === suggestion.id);
    if (service) {
      addToCart(service);
    } else {
      const product = productos.find(item => item.id === suggestion.id);
      if (product) addToCart(product);
    }
  };

  return (
    <div className="app">
      {!hideNavbar && (
        <Navbar
          cartCount={cartCount}
          onSearch={filterSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
      <AppRoutes
        addToCart={addToCart}
        productos={productos}
        servicios={servicios}
        particlesRef={particlesRef}
        filterSuggestions={filterSuggestions}
        handleSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}

export default App;