import React, { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Service, SearchSuggestion } from '../types';
import { servicesData } from '../utils/constants';

// Importaciones directas (componentes livianos que se necesitan de inmediato)
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import Cart from '../componentes/Cart';
import ProtectedRoute from './ProtectedRoute';

// Lazy Loading: Estos componentes pesados solo se descargan cuando el usuario navega a ellos
const Dashboard = React.lazy(() => import('../componentes/TableAdmin/Dashboard'));
const Panel = React.lazy(() => import('../componentes/TableAdmin/Panel'));
const Usuarios = React.lazy(() => import('../componentes/TableAdmin/Usuarios'));
const OrdenesServicio = React.lazy(() => import('../componentes/TableOrdenServicios/OrdenesServicio'));
const DetallesOrden = React.lazy(() => import('../componentes/TableOrdenServicios/DetallesOrden'));
const AsignacionTecnicos = React.lazy(() => import('../componentes/TableOrdenServicios/AsignacionTecnicos'));
const Servicios = React.lazy(() => import('../componentes/TableServicios/Servicios'));
const TableProductos = React.lazy(() => import('../componentes/TableProductos/productos'));
const Categorias = React.lazy(() => import('../componentes/TableCategorias/Categorias'));
const Motos = React.lazy(() => import('../componentes/TableMotos/Motos'));
const Tableinforme = React.lazy(() => import('../componentes/Tableinforme/informe'));
const Tablehistorial = React.lazy(() => import('../componentes/Tablehistorial/historial'));
const TableComprobante = React.lazy(() => import('../componentes/TableComprobante/Comprobante'));
const TecnicoDashboard = React.lazy(() => import('../componentes/TableTecnico/TecnicoDashboard'));
const ClienteDashboard = React.lazy(() => import('../componentes/TableCliente/ClienteDashboard'));
const ClienteOrdenes = React.lazy(() => import('../componentes/TableCliente/ClienteOrdenes'));
const ClienteMotos = React.lazy(() => import('../componentes/TableCliente/ClienteMotos'));
const ClienteComprobantes = React.lazy(() => import('../componentes/TableCliente/ClienteComprobantes'));
const ClienteHistorial = React.lazy(() => import('../componentes/TableCliente/ClienteHistorial'));

// ==================== Componentes de página ====================

interface HomePageProps {
  addToCart: (service: Service) => void;
  productos: Service[];
}

// Importaciones dinámicas de componentes de la tienda
import Header from '../componentes/Header';
import ServiceSection from '../componentes/ServiceSection';
import InfoSection from '../componentes/InfoSection';
import Footer from '../componentes/Footer';

const HomePage: React.FC<HomePageProps> = ({ addToCart, productos }) => {
  const categories = ['Mantenimiento', 'Reparaciones', 'Diagnósticos', 'Instalaciones'];

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          {categories.map((category) => {
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

          {Array.from(new Set(productos.map(p => p.category))).map((category) => {
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

// ==================== Props principales ====================

interface AppRoutesProps {
  addToCart: (service: Service) => void;
  productos: Service[];
  particlesRef: React.RefObject<HTMLDivElement>;
  filterSuggestions: (query: string) => SearchSuggestion[];
  handleSuggestionClick: (suggestion: SearchSuggestion) => void;
}

// Componente de carga para las rutas con lazy loading
const RouteLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#050505',
    color: '#fff',
    fontSize: '1.1rem'
  }}>
    Cargando...
  </div>
);

// ==================== Componente principal de rutas ====================

const AppRoutes: React.FC<AppRoutesProps> = ({
  addToCart,
  productos,
  particlesRef,
}) => {
  const isAuthenticated = Boolean(localStorage.getItem('user_token'));

  // Determinar la ruta de redirección según el rol
  const getRedirectPath = () => {
    const role = localStorage.getItem('user_role');
    if (role === 'tecnico') return '/tecnico/dashboard';
    if (role === 'cliente') return '/cliente/dashboard';
    return '/admin/dashboard';
  };

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* ========== Rutas públicas ========== */}
        <Route
          path="/"
          element={
            <>
              <div className="particles" ref={particlesRef}></div>
              <div className="ktm-container">
                <HomePage addToCart={addToCart} productos={productos} />
                <Footer />
              </div>
            </>
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={getRedirectPath()} replace />
              : <Login />
          }
        />
        <Route
          path="/registro"
          element={
            isAuthenticated
              ? <Navigate to={getRedirectPath()} replace />
              : <Registro />
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/carrito" element={<Cart />} />

        {/* ========== Rutas de Administrador ========== */}
        <Route
          path="/admin/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <Panel /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="administradores" element={<Usuarios />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="ordenes_servicio" element={<OrdenesServicio />} />
          <Route path="asignacion_tecnicos" element={<AsignacionTecnicos />} />
          <Route path="detalles-orden" element={<DetallesOrden />} />
          <Route path="tecnicos" element={<Usuarios />} />
          <Route path="clientes" element={<Usuarios />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="productos" element={<TableProductos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="motos" element={<Motos />} />
          <Route path="informe" element={<Tableinforme />} />
          <Route path="comprobante" element={<TableComprobante />} />
          <Route path="historial" element={<Tablehistorial />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* ========== Rutas de Técnico ========== */}
        <Route element={<ProtectedRoute allowedRole="tecnico" />}>
          <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
          <Route path="/tecnico/informes" element={<Tableinforme />} />
        </Route>

        {/* ========== Rutas de Cliente ========== */}
        <Route element={<ProtectedRoute allowedRole="cliente" />}>
          <Route path="/cliente" element={<ClienteDashboard />}>
            <Route index element={<Navigate to="/cliente/dashboard" replace />} />
            <Route path="dashboard" element={<div>Dashboard Cliente (próximamente)</div>} />
            <Route path="ordenes" element={<ClienteOrdenes />} />
            <Route path="motos" element={<ClienteMotos />} />
            <Route path="comprobantes" element={<ClienteComprobantes />} />
            <Route path="historial" element={<ClienteHistorial />} />
            <Route path="servicios" element={<div>Servicios</div>} />
            <Route path="perfil" element={<div>Mi Perfil</div>} />
            <Route path="*" element={<Navigate to="/cliente/dashboard" replace />} />
          </Route>
        </Route>

        {/* ========== Ruta por defecto ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
