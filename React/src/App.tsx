import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Header from './componentes/Header';
import ServiceSection from './componentes/ServiceSection';
import InfoSection from './componentes/InfoSection';
import AccessSection from './componentes/AccessSection';
import Footer from './componentes/Footer';
import Login from './pages/Login';
import Panel from './componentes/TableAdmin/Panel';
import Admins from './componentes/TableAdmin/Admin';
import OrdenesServicio from './componentes/TableOrdenServicios/OrdenesServicio';
import DetallesOrden from './componentes/TableOrdenServicios/DetallesOrden';
import Servicios from './componentes/TableServicios/Servicios';
import { servicesData, searchSuggestionsData } from './utils/constants';
import { Service, SearchSuggestion, CartItem } from './types';
import TableProductos from './componentes/TableProductos/productos';
import Dashboard from './componentes/TableAdmin/Dashboard';
import Tecnicos from './componentes/TableTecnico/Tecnico';
import TecnicoDashboard from './componentes/TableTecnico/TecnicoDashboard';
import ProtectedTecnicoRoute from './routes/ProtectedTecnicoRoute';
import Clientes from './componentes/TableCliente/Clientes';
import Motos from './componentes/TableMotos/Motos';
import Tableinforme from './componentes/Tableinforme/informe';
import Tablehistorial from './componentes/Tablehistorial/historial';
import TableComprobante from './componentes/TableComprobante/Comprobante';
import ClienteDashboard from './componentes/TableCliente/ClienteDashboard';

const HomePage: React.FC<{ addToCart: (service: Service) => void }> = ({ addToCart }) => {
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
                {index < categories.length - 1 && <div className="section-divider"></div>}
              </React.Fragment>
            );
          })}
          <div className="section-divider"></div>
          <InfoSection />
          <AccessSection />
        </div>
      </main>
    </>
  );
};

const StorefrontPage: React.FC<{
  addToCart: (service: Service) => void;
  cartCount: number;
  onSearch: (query: string) => SearchSuggestion[];
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  particlesRef: React.RefObject<HTMLDivElement>;
}> = ({ addToCart, cartCount, onSearch, onSuggestionClick, particlesRef }) => {
  return (
    <>
      <div className="particles" ref={particlesRef}></div>
      <Navbar
        cartCount={cartCount}
        onSearch={onSearch}
        onSuggestionClick={onSuggestionClick}
      />
      <div className="ktm-container">
        <HomePage addToCart={addToCart} />
        <Footer />
      </div>
    </>
  );
};

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('ktmCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const location = useLocation();
  const particlesRef = useRef<HTMLDivElement>(null);
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthenticated = Boolean(localStorage.getItem('user_token'));

  useEffect(() => {
    localStorage.setItem('ktmCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container || isAdminPage || isLoginPage) return;

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
  }, [isAdminPage, isLoginPage, location.pathname]);

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

    return searchSuggestionsData
      .filter(
        item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const service = servicesData.find(item => item.id === suggestion.id);
    if (service) addToCart(service);
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
      <Routes>
        <Route
          path="/"
          element={
            <StorefrontPage
              addToCart={addToCart}
              cartCount={cartCount}
              onSearch={filterSuggestions}
              onSuggestionClick={handleSuggestionClick}
              particlesRef={particlesRef}
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
          path="/admin"
          element={isAuthenticated ? <Panel /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="administradores" element={<Admins />} />
          <Route path="ordenes_servicio" element={<OrdenesServicio />} />
          <Route path="detalles-orden" element={<DetallesOrden />} />
          <Route path="tecnicos" element={<Tecnicos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="productos" element={<TableProductos />} />
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
          <Route path="mis-ordenes" element={<div>Mis Órdenes</div>} />
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