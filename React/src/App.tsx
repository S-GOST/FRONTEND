import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './componentes/Navbar';
import AppRoutes from './routes/AppRoutes';
import { useCart } from './hooks/useCart';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { clearSession } from './services/auth.services';
import { Service, SearchSuggestion } from './types';
import { servicesData, searchSuggestionsData } from './utils/constants';
import { obtenerProductos } from './services/producto.service';

function App() {
  const [productos, setProductos] = useState<Service[]>([]);
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
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).data)) {
            productosArray = (res.data as any).data;
          } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).productos)) {
            productosArray = (res.data as any).productos;
          }

          if (productosArray.length > 0) {
            const mappedProductos = productosArray.map((p: any) => ({
              id: String(p.ID_PRODUCTOS),
              name: p.Nombre,
              category: p.categoria_nombre || 'Producto',
              price: Number(p.Precio),
              description: `Producto de la marca ${p.Marca || 'KTM'}`,
              icon: 'bi-box-seam',
              ID_PRODUCTOS: p.ID_PRODUCTOS
            }));
            setProductos(mappedProductos);
          }
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };
    fetchProductos();
  }, []);

  // Efecto de partículas decorativas (solo en la tienda principal)
  useEffect(() => {
    const container = particlesRef.current;
    if (!container || hideNavbar || isCartPage) return;

    container.innerHTML = '';
    for (let i = 0; i < 30; i += 1) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float ${5 + Math.random() * 10}s linear infinite`;
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
    const allSuggestions = [...searchSuggestionsData, ...dynamicProductSuggestions];
    return allSuggestions
      .filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const service = servicesData.find(item => item.id === suggestion.id);
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
        particlesRef={particlesRef}
        filterSuggestions={filterSuggestions}
        handleSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}

export default App;