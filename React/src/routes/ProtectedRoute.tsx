import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Revisamos si existe el token que guardamos en authService.ts
  const token = localStorage.getItem('user_token');

  // Si no hay token, lo mandamos al login
  // Si hay token, Outlet permite que se cargue la página solicitada
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;