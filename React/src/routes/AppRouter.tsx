import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import App from '../App'; 
import Admins from '../componentes/TableAdmin/Admin'; // Página de administración de usuarios
import ProtectedRoute from './ProtectedRoute'; // Importa el portero

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS: Cualquiera puede verlas */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        
        {/* RUTAS PRIVADAS: Solo con Login previo */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/usuarios" element={<Admins />} />
          {/* Aquí puedes meter más rutas protegidas, como /dashboard o /servicios */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;