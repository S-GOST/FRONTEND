import { Routes, Route } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import TecnicoDashboard from '../componentes/TableTecnico/TecnicoDashboard';
import AdminDashboard from '../componentes/TableAdmin/Dashboard';
import ProtectedTecnicoRoute from './ProtectedTecnicoRoute';
import ProtectedAdminRoute from './ProtectedAdminRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas para ADMIN */}
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Más rutas de admin: motos, servicios, etc. */}
      </Route>

      {/* Rutas protegidas para TÉCNICO */}
      <Route element={<ProtectedTecnicoRoute />}>
        <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;