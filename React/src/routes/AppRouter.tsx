import { Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import TecnicoDashboard from '../componentes/TableTecnico/TecnicoDashboard';
import AdminDashboard from '../componentes/TableAdmin/Dashboard';
import Admins from '../componentes/TableAdmin/Admin';
import Clientes from '../componentes/TableCliente/Clientes';
import OrdenesServicio from '../componentes/TableOrdenServicios/OrdenesServicio';
import DetallesOrden from '../componentes/TableOrdenServicios/DetallesOrden';
import Panel from '../componentes/TableAdmin/Panel';
import ClientePanel from '../componentes/TableCliente/ClientePanel';
import ClienteDashboard from '../componentes/TableCliente/ClienteDashboard';
import ProtectedTecnicoRoute from './ProtectedTecnicoRoute';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import ProtectedClienteRoute from './ProtectedClienteRoute';


const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas para ADMIN */}
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<Panel />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="administradores" element={<Admins />} />
          <Route path="tecnicos" element={<AdminDashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ordenes_servicio" element={<OrdenesServicio />} />
          <Route path="motos" element={<AdminDashboard />} />
          <Route path="detalles-orden" element={<DetallesOrden />} />
          <Route path="servicios" element={<AdminDashboard />} />
          <Route path="productos" element={<AdminDashboard />} />
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
        <Route path="/cliente" element={<ClientePanel />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClienteDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;