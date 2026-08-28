import React, { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginService } from '../services/auth.services';
import logo from '../assets/icons/rock.png';
import './Login.css';

interface LoginFormInputs {
  usuario: string;
  contrasena: string;
}

interface LoginErrorResponse {
  message?: string;
  mensaje?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: { usuario: '', contrasena: '' },
  });

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null);
    setLoading(true);

    try {
      const response = await loginService(data.usuario, data.contrasena);
      const userRole = response.rol ?? localStorage.getItem('user_role') ?? 'admin';

      if (userRole === 'tecnico') {
        navigate('/tecnico/dashboard', { replace: true });
      } else if (userRole === 'cliente') {
        navigate('/cliente/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      const error = err as AxiosError<LoginErrorResponse>;
      if (error.response?.status === 401) {
        setServerError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      } else if (error.response?.status === 403) {
        const msg = error.response?.data?.mensaje || error.response?.data?.message || 'Tu cuenta no tiene acceso al sistema.';
        setServerError(msg);
      } else {
        setServerError('Error de conexión con el servidor KTM.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper notranslate" translate="no">
      <div className="login-orb login-orb-1"></div>
      <div className="login-orb login-orb-2"></div>
      <div className="login-grid-overlay"></div>

      <section className="login-form-panel">
        <div className="login-form-shell animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="login-card">
            <div className="login-card-head">
              <div className="login-card-brand">
                <div className="login-card-logo-wrap">
                  <img src={logo} alt="Logo KTM Rocket Service" className="login-card-logo" />
                </div>
              </div>
            </div>

            {serverError && (
              <div className="error-alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{serverError}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit(onSubmit)} key="login-form-clean">
              <div className="form-group">
                <div className={`input-shell ${errors.usuario ? 'has-error' : ''}`}>
                  <i className="bi bi-person-badge input-icon"></i>
                  <input
                    id="usuario"
                    type="text"
                    className="login-input"
                    placeholder="Ingresa tu usuario"
                    autoComplete="off"
                    {...register('usuario', { required: 'Campo obligatorio' })}
                  />
                  <div className="input-glow"></div>
                </div>
                {errors.usuario && (
                  <p className="field-error">{errors.usuario.message}</p>
                )}
              </div>

              <div className="form-group">
                <div className={`input-shell ${errors.contrasena ? 'has-error' : ''}`}>
                  <i className="bi bi-shield-lock input-icon"></i>
                  <input
                    id="contrasena"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="new-password"
                    {...register('contrasena', { required: 'Campo obligatorio' })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                  <div className="input-glow"></div>
                </div>
                {errors.contrasena && (
                  <p className="field-error">{errors.contrasena.message}</p>
                )}
              </div>

              <div className="forgot-password-row">
                <Link to="/forgot-password" className="forgot-password-link">
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              <button type="submit" className="btn-ktm login-submit" disabled={loading}>
                <span className="submit-content">
                  {loading ? (
                    <>
                      <span className="button-spinner"></span>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      Ingresar al panel
                    </>
                  )}
                </span>
                <div className="submit-glow"></div>
              </button>
            </form>

            <div className="login-card-footer">
              <p>Solo personal autorizado con credenciales KTM Rocket Service.</p>
              <Link to="/" className="footer-home-link">
                <i className="bi bi-house-door"></i>
                Regresar al portal principal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;