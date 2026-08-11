import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { resetPassword } from '../../services/auth.services';
import './ResetPassword.css';
import logoKTM from '../../assets/icons/rock.png';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strengthLevel = getPasswordStrength(password);
  const strengthLabels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const strengthColors = ['#ff4444', '#ff8800', '#ffcc00', '#88cc00', '#00cc44'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, complete ambos campos.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8 || !hasUpperCase || !hasNumber || !hasSymbol) {
      Swal.fire({
        title: 'Contraseña no cumple requisitos',
        text: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.',
        icon: 'warning',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token!, password);
      Swal.fire({
        title: '¡Contraseña Actualizada!',
        text: 'Contraseña actualizada exitosamente. Inicie sesión con su nueva contraseña.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      }).then(() => {
        navigate('/login');
      });
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'Token inválido o expirado. Solicite un nuevo enlace.';
      Swal.fire({
        title: 'Error',
        text: mensaje,
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
    <div className="reset-password-container">
      <div className="reset-password-card">
        <img src={logoKTM} alt="KTM Logo" className="logo" />
        <h2>Restablecer Contraseña</h2>
        <p>Ingrese su nueva contraseña. Debe tener al menos 8 caracteres.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <i className="bi bi-lock"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>

          {password.length > 0 && (
            <div className="password-strength">
              <div className="strength-bar-bg">
                <div
                  className="strength-bar-fill"
                  style={{
                    width: `${(strengthLevel / 4) * 100}%`,
                    backgroundColor: strengthColors[strengthLevel],
                  }}
                ></div>
              </div>
              <span className="strength-label" style={{ color: strengthColors[strengthLevel] }}>
                {strengthLabels[strengthLevel]}
              </span>
            </div>
          )}

          <div className="input-group">
            <i className="bi bi-lock-fill"></i>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>

          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="mismatch-warning">Las contraseñas no coinciden</p>
          )}

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
        <p className="login-link">
          <Link to="/login">Volver a inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
