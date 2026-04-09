import { Navigate, Outlet } from 'react-router-dom';

const ProtectedClienteRoute = () => {
  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  console.log('ProtectedClienteRoute - Token:', !!token, 'Role:', role);

  // Si no hay token, redirigir al login
  if (!token) {
    console.log('No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero no es cliente, redirige al dashboard de admin
  if (role !== 'cliente') {
    console.log('Role is not cliente, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('Access granted to cliente routes');
  // Si es cliente, permitir acceso
  return <Outlet />;
};

export default ProtectedClienteRoute;
