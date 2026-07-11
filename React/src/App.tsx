import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Header from './componentes/Header';
import ServiceSection from './componentes/ServiceSection';
import InfoSection from './componentes/InfoSection';
import AccessSection from './componentes/AccessSection';
import Footer from './componentes/Footer';
import Cart from './componentes/Cart';
import Login from './pages/Login';
import Panel from './componentes/TableAdmin/Panel';
import OrdenesServicio from './componentes/TableOrdenServicios/OrdenesServicio';
import DetallesOrden from './componentes/TableOrdenServicios/DetallesOrden';
import Servicios from './componentes/TableServicios/Servicios';
import { servicesData, searchSuggestionsData } from './utils/constants';
import { Service, SearchSuggestion, CartItem } from './types';
import TableProductos from './componentes/TableProductos/productos';
import Categorias from './componentes/TableCategorias/Categorias';
import Dashboard from './componentes/TableAdmin/Dashboard';
import TecnicoDashboard from './componentes/TableTecnico/TecnicoDashboard';
import ProtectedTecnicoRoute from './routes/ProtectedTecnicoRoute';
import Motos from './componentes/TableMotos/Motos';
import Tableinforme from './componentes/Tableinforme/informe';
import Tablehistorial from './componentes/Tablehistorial/historial';
import TableComprobante from './componentes/TableComprobante/Comprobante';
import ClienteDashboard from './componentes/TableCliente/ClienteDashboard';
import Usuarios from './componentes/TableAdmin/Usuarios';
import ClienteOrdenes from './componentes/TableCliente/ClienteOrdenes';
import { obtenerProductos } from './services/producto.service';

const HomePage: React.FC<{ addToCart: (service: Service) => void, productos: Service[] }> = ({ addToCart, productos }) => {
  const categories = ['Mantenimiento', 'Reparaciones', 'Diagnósticos', 'Instalaciones'];

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          {categories.map((category, index) => {
            const filteredServices = servicesData.filter(
              service => service.category === category
            );

            return (
              <React.Fragment key={category}>
                <ServiceSection
                  title={category}
                  subtitle="Categorías"
                  services={filteredServices}
                  onAddToCart={addToCart}
                />
                <div className="section-divider"></div>
              </React.Fragment>
            );
          })}
          
          {Array.from(new Set(productos.map(p => p.category))).map((category, index) => {
            const filteredProducts = productos.filter(
              product => product.category === category
            );

            return (
              <React.Fragment key={`prod-cat-${category}`}>
                <ServiceSection
                  title={category.toUpperCase()}
                  subtitle="Productos y Repuestos"
                  services={filteredProducts}
                  onAddToCart={addToCart}
                />
                <div className="section-divider"></div>
              </React.Fragment>
            );
          })}

          <InfoSection />
        </div>
      </main>
    </>
  );
};

const StorefrontPage: React.FC<{
  addToCart: (service: Service) => void;
  particlesRef: React.RefObject<HTMLDivElement>;
  productos: Service[];
}> = ({ addToCart, particlesRef, productos }) => {
  return (
    <>
      <div className="particles" ref={particlesRef}></div>
      <div className="ktm-container">
        <HomePage addToCart={addToCart} productos={productos} />
        <Footer />
      </div>
    </>
  );
};

function App() {
  const [productos, setProductos] = useState<Service[]>([]);

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
              ID_PRODUCTOS: p.ID_PRODUCTOS // Para que addToCart lo detecte como producto
            }));
            setProductos(mappedProductos);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProductos();
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('ktmCart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
    }
    return [];
  });

  const location = useLocation();
  const particlesRef = useRef<HTMLDivElement>(null);
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isTecnicoPage = location.pathname.startsWith('/tecnico');
  const isClientePage = location.pathname.startsWith('/cliente');
  const isCartPage = location.pathname === '/carrito';
  const isAuthenticated = Boolean(localStorage.getItem('user_token'));
  const userRole = localStorage.getItem('user_role');

  useEffect(() => {
    localStorage.setItem('ktmCart', JSON.stringify(cart));
  }, [cart]);

  // Sync cart state when Cart.tsx (or another tab) modifies localStorage
  useEffect(() => {
    const syncCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('ktmCart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(Array.isArray(parsed) ? parsed : []);
        } else {
          setCart([]);
        }
      } catch (e) {
        console.error('Error syncing cart:', e);
      }
    };

    // Listen for the custom event dispatched by Cart.tsx
    window.addEventListener('cartUpdated', syncCartFromStorage);
    // Listen for cross-tab localStorage changes
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'ktmCart') syncCartFromStorage();
    });

    return () => {
      window.removeEventListener('cartUpdated', syncCartFromStorage);
      window.removeEventListener('storage', syncCartFromStorage);
    };
  }, []);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container || isAdminPage || isTecnicoPage || isClientePage || isLoginPage || isCartPage) return;

    container.innerHTML = '';

    for (let i = 0; i < 30; i += 1) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float ${5 + Math.random() * 10}s linear infinite`;
      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [isAdminPage, isLoginPage, isCartPage, location.pathname]);

  const addToCart = (service: Service) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...service, quantity: 1 }];
    });
  };

  const filterSuggestions = (query: string): SearchSuggestion[] => {
    if (!query.trim()) return [];

    const dynamicProductSuggestions: SearchSuggestion[] = productos.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      icon: p.icon,
      price: p.price.toString()
    }));

    const allSuggestions = [...searchSuggestionsData, ...dynamicProductSuggestions];

    return allSuggestions
      .filter(
        item =>
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

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Determinar la ruta de redirección según el rol
  const getRedirectPath = () => {
    const role = localStorage.getItem('user_role');
    if (role === 'tecnico') return '/tecnico/dashboard';
    if (role === 'cliente') return '/cliente/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="app">
      {!isLoginPage && !isAdminPage && !isTecnicoPage && !isClientePage && !(isCartPage && userRole === 'cliente') && (
        <Navbar
          cartCount={cartCount}
          onSearch={filterSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <StorefrontPage
              addToCart={addToCart}
              particlesRef={particlesRef}
              productos={productos}
            />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/carrito"
          element={<Cart />}
        />
        {/* Dashboard sin Panel (pantalla completa) */}
        <Route
          path="/admin/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        {/* Resto de rutas admin con Panel (sidebar) */}
        <Route
          path="/admin"
          element={isAuthenticated ? <Panel /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="administradores" element={<Usuarios />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="ordenes_servicio" element={<OrdenesServicio />} />
          <Route path="detalles-orden" element={<DetallesOrden />} />
          <Route path="tecnicos" element={<Usuarios />} />
          <Route path="clientes" element={<Usuarios />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="productos" element={<TableProductos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="motos" element={<Motos />} />
          <Route path='informe' element={<Tableinforme />} />
          <Route path='comprobante' element={<TableComprobante />} />
          <Route path='historial' element={<Tablehistorial />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        <Route element={<ProtectedTecnicoRoute />}>
          <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
        </Route>
        {/* Ruta protegida para cliente */}
        <Route
          path="/cliente"
          element={
            isAuthenticated && localStorage.getItem('user_role') === 'cliente' ? (
              <ClienteDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/cliente/dashboard" replace />} />
          <Route path="dashboard" element={<div>Dashboard Cliente (próximamente)</div>} />
          <Route path="ordenes" element={<ClienteOrdenes />} />
          <Route path="mis-motos" element={<div>Mis Motos</div>} />
          <Route path="servicios" element={<div>Servicios</div>} />
          <Route path="perfil" element={<div>Mi Perfil</div>} />
          <Route path="*" element={<Navigate to="/cliente/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;