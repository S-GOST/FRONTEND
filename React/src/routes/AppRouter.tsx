import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from '../App';
import Admins from '../componentes/TableAdmin/Admin';
import Servicio from '../componentes/TableServicios/Servicios';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/usuarios" element={<Admins />} />
          <Route path="/admin/servicios" element={<Servicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
