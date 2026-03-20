import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redireccionar
import AuthLayout from '../layouts/AuthLayout';
import { loginService } from '../services/authService';
import '../pages/Login.css'; // Asegúrate de tener este archivo para estilos personalizados
const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        await loginService(usuario, contrasena);
        // Redirige al panel de administración tras éxito
        navigate('/admin/usuarios');
      } catch (err) {
        setError('Usuario o contraseña incorrectos');
      }
    };

  return (
  <AuthLayout>
    <div className="login-form-container">
      <form onSubmit={handleLogin}>
        <h2 className="login-title">SGOST Administrador</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Usuario</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ingrese su usuario"
            value={usuario} 
            onChange={(e) => setUsuario(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Contraseña</label>
          <input 
            type="password" 
            className="form-control" 
            placeholder="********"
            value={contrasena} 
            onChange={(e) => setContrasena(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="btn-login">
          Iniciar Sesión
        </button>
      </form>
    </div>
  </AuthLayout>
);
};
export default Login;