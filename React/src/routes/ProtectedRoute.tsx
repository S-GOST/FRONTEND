import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  /** Rol permitido para acceder a esta ruta (ej: 'admin', 'tecnico', 'cliente') */
  allowedRole: 'admin' | 'tecnico' | 'cliente';
  /** Ruta a la que redirigir si el usuario no tiene el rol correcto (por defecto: /login) */
  fallbackPath?: string;
}

/**
 * Componente genérico de ruta protegida.
 * Reemplaza a ProtectedAdminRoute, ProtectedTecnicoRoute y ProtectedClienteRoute
 * que tenían exactamente la misma lógica duplicada en 3 archivos separados.
 */
const ProtectedRoute = ({ allowedRole, fallbackPath }: ProtectedRouteProps) => {
  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero el rol no coincide, redirigir a la ruta de fallback
  if (role !== allowedRole) {
    const defaultFallback = role === 'tecnico'
      ? '/tecnico/dashboard'
      : role === 'cliente'
        ? '/cliente/dashboard'
        : '/admin/dashboard';
    return <Navigate to={fallbackPath || defaultFallback} replace />;
  }

  // Si tiene el rol correcto, permitir acceso
  return <Outlet />;
};

export default ProtectedRoute;
