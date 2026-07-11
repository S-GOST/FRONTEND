import { Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import Cart from '../componentes/Cart';
import TecnicoDashboard from '../componentes/TableTecnico/TecnicoDashboard';
import AdminDashboard from '../componentes/TableAdmin/Dashboard';
import Admins from '../componentes/TableAdmin/Admin';
import Usuarios from '../componentes/TableAdmin/Usuarios';
import Clientes from '../componentes/TableCliente/Clientes';
import OrdenesServicio from '../componentes/TableOrdenServicios/OrdenesServicio';
import DetallesOrden from '../componentes/TableOrdenServicios/DetallesOrden';
import Panel from '../componentes/TableAdmin/Panel';
import ClienteDashboard from '../componentes/TableCliente/ClienteDashboard';
import ClienteOrdenes from '../componentes/TableCliente/ClienteOrdenes';
import Categorias from '../componentes/TableCategorias/Categorias';
import TableProductos from '../componentes/TableProductos/productos';
import Servicios from '../componentes/TableServicios/Servicios';
import ProtectedTecnicoRoute from './ProtectedTecnicoRoute';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import ProtectedClienteRoute from './ProtectedClienteRoute';


const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/carrito" element={<Cart />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas para ADMIN */}
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<Panel />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="administradores" element={<Admins />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="tecnicos" element={<AdminDashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ordenes_servicio" element={<OrdenesServicio />} />
          <Route path="motos" element={<AdminDashboard />} />
          <Route path="detalles-orden" element={<DetallesOrden />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="productos" element={<TableProductos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="informe" element={<AdminDashboard />} />
          <Route path="comprobante" element={<AdminDashboard />} />
          <Route path="historial" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Rutas protegidas para TÉCNICO */}
      <Route element={<ProtectedTecnicoRoute />}>
        <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
      </Route>

      {/* Rutas protegidas para CLIENTE */}
      <Route element={<ProtectedClienteRoute />}>
        <Route path="/cliente" element={<ClienteDashboard />}>
          <Route index element={<></>} />
          <Route path="dashboard" element={<></>} />
          <Route path="ordenes" element={<ClienteOrdenes />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;