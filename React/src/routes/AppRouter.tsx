import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Importa los componentes necesarios de react-router-dom para manejar la navegación entre páginas
import Login from '../pages/Login'; // Importa la página de Login que se mostrará cuando el usuario acceda a la ruta /login
import App from '../App'; // Importa el componente principal de la aplicación, que se mostrará en la ruta raíz /  
import Admins from '../componentes/TableAdmin/Admin'; // Página de administración de usuarios
import ProtectedRoute from './ProtectedRoute'; // Importa el portero

const AppRouter = () => { // Componente que define las rutas de la aplicación, incluyendo rutas públicas y protegidas, utilizando react-router-dom para manejar la navegación entre páginas y asegurar que solo los usuarios autenticados puedan acceder a ciertas rutas.
  return (
    <BrowserRouter> 
      <Routes>
        {/* RUTAS PÚBLICAS: Cualquiera puede verlas */}
        <Route path="/" element={<App />} /> // Ruta raíz que muestra el componente principal de la aplicación, generalmente la página de inicio o landing page
        <Route path="/login" element={<Login />} /> // Ruta para la página de login, donde los usuarios pueden ingresar sus credenciales para autenticarse y acceder a las rutas protegidas
        
        {/* RUTAS PRIVADAS: Solo con Login previo */}
        <Route element={<ProtectedRoute />}> // Componente que actúa como portero para las rutas protegidas, verificando si el usuario está autenticado antes de permitir el acceso a las rutas hijas
          <Route path="/admin/usuarios" element={<Admins />} /> // Ruta protegida para la administración de usuarios, solo accesible para usuarios autenticados, donde se pueden gestionar los usuarios del sistema
          {/* Aquí puedes meter más rutas protegidas, como /dashboard o /servicios */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter; // Exporta el componente de rutas para que pueda ser utilizado en otras partes de la aplicación, como en main.tsx para renderizar la aplicación con las rutas definidas.