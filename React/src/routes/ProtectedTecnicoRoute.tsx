import { Navigate, Outlet } from 'react-router-dom';

const ProtectedTecnicoRoute = () => {
  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  console.log('ProtectedTecnicoRoute - Token:', !!token, 'Role:', role);

  // Si no hay token, redirigir al login
  if (!token) {
    console.log('No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero no es técnico, redirigir al dashboard de admin
  if (role !== 'tecnico') {
    console.log('Role is not tecnico, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('Access granted to tecnico routes');
  // Si es técnico, permitir acceso
  return <Outlet />;
};

export default ProtectedTecnicoRoute;