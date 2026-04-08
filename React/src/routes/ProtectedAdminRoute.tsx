// ProtectedAdminRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  console.log('ProtectedAdminRoute - Token:', !!token, 'Role:', role);

  // Si no hay token, redirigir al login
  if (!token) {
    console.log('No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero no es admin, redirigir al dashboard de técnico
  if (role !== 'admin') {
    console.log('Role is not admin, redirecting to tecnico dashboard');
    return <Navigate to="/tecnico/dashboard" replace />;
  }

  console.log('Access granted to admin routes');
  // Si es admin, permitir acceso
  return <Outlet />;
};

export default ProtectedAdminRoute;