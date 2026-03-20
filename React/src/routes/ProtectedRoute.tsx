import { Navigate, Outlet } from 'react-router-dom'; // Importa los componentes necesarios de react-router-dom para manejar la navegación y redirección entre páginas, específicamente Navigate para redirigir a los usuarios no autenticados al login, y Outlet para renderizar las rutas hijas protegidas si el usuario está autenticado.

const ProtectedRoute = () => { // Componente que actúa como portero para las rutas protegidas, verificando si el usuario está autenticado antes de permitir el acceso a las rutas hijas. Si el usuario no está autenticado, lo redirige al login; si está autenticado, permite que se rendericen las rutas hijas utilizando Outlet.
  // Revisamos si existe el token que guardamos en authService.ts
  const token = localStorage.getItem('user_token'); 

  // Si no hay token, lo mandamos al login
  // Si hay token, Outlet permite que se cargue la página solicitada
  return token ? <Outlet /> : <Navigate to="/login" replace />; // Si el token existe, renderiza las rutas hijas (las páginas protegidas), de lo contrario, redirige al usuario a la página de login para que se autentique antes de acceder a las rutas protegidas.
};

export default ProtectedRoute; // Exporta el componente de ruta protegida para que pueda ser utilizado en otras partes de la aplicación, como en AppRouter.tsx para envolver las rutas que deben ser protegidas y asegurar que solo los usuarios autenticados puedan acceder a ellas.