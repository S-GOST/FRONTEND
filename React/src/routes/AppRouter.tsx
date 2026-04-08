import { Routes, Route } from 'react-router-dom';
import App from '../App';
import TecnicoDashboard from '../componentes/TableTecnico/TecnicoDashboard';
import Login from '../pages/Login';
import ProtectedTecnicoRoute from './ProtectedTecnicoRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedTecnicoRoute />}>
        <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
      </Route>

      {/* Ruta temporal para probar sin login */}
      <Route path="/prueba-tecnico" element={<div><h1>Dashboard de Técnico</h1><p>Funciona correctamente</p></div>} />
    </Routes>
  );
};

export default AppRouter;
