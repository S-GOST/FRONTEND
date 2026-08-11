import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { requestPasswordReset } from '../../services/auth.services';
import './ForgotPassword.css';
import logoKTM from '../../assets/icons/rock.png';

const ForgotPassword = () => {
  const [correo, setCorreo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correo) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, ingrese su correo electrónico.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    if (!validateEmail(correo)) {
      Swal.fire({
        title: 'Formato Inválido',
        text: 'Ingrese un formato de correo válido (ej: usuario@correo.com)',
        icon: 'warning',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(correo);
      Swal.fire({
        title: 'Solicitud Enviada',
        text: 'Si el correo está registrado, recibirá un enlace de recuperación.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      navigate('/login');
    } catch (error) {
      console.error('Error enviando recuperación:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al procesar la solicitud.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <img src={logoKTM} alt="KTM Logo" className="logo" />
        <h2>Recuperación de Contraseña</h2>
        <p>Ingrese su correo electrónico registrado y le enviaremos instrucciones para restablecer su contraseña.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
        <p className="login-link">
          ¿Recordaste tu contraseña? <Link to="/login">Volver a inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
