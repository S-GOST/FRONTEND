import React, { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginService, loginClienteService } from '../services/auth.services';
import logo from '../assets/icons/rock.png';
import './Login.css';

interface LoginFormInputs {
  usuario: string;
  contrasena: string;
}

interface LoginErrorResponse {
  message?: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  // 🔹 Limpia los campos automáticamente al montar el componente
  useEffect(() => {
    reset({ usuario: '', contrasena: '' });
  }, [reset]);

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
      // Primero intenta admin/tecnico
      const response = await loginService(data.usuario, data.contrasena);
      const userRole = response.rol ?? localStorage.getItem('user_role') ?? 'admin';
      if (userRole === 'tecnico') {
        window.location.replace('/tecnico/dashboard');
      } else {
        window.location.replace('/admin/dashboard');
      }
    } catch (err) {
      // Si falla, intenta login de cliente
      const error = err as AxiosError<LoginErrorResponse>;
      if (error.response?.status === 401) {
        try {
          const clienteRes = await loginClienteService(data.usuario, data.contrasena);
          if (clienteRes.token) {
            window.location.replace('/cliente/dashboard');
            return;
          } else {
            setServerError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
          }
        } catch (clienteErr) {
          setServerError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
        }
      } else {
        setServerError('Error de conexión con el servidor KTM.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper notranslate" translate="no">
      <div className="login-ambient login-ambient-b"></div>
      <div className="login-grid-overlay"></div>

      <section className="login-showcase">
        <div className="login-showcase-topbar">
          <Link to="/" className="login-back-link">
            <i className="bi bi-arrow-left"></i>
            Volver al inicio
          </Link>
        </div>

        <div className="login-showcase-content">
          <div className="login-brand-block">
            <img src={logo} alt="KTM Rocket Service" className="login-showcase-logo" />
            <span className="login-brand-caption">KTM Rocket Service</span>
          </div>

          <p className="login-kicker">Panel ejecutivo</p>
          <h1 className="login-hero-title">
            Decide más rápido
            <span> sobre cada servicio, cliente y motocicleta.</span>
          </h1>
          <p className="login-hero-copy">
            Una consola administrativa pensada para ordenar la operación del
            taller, asignar responsables y seguir cada orden con criterio técnico.
          </p>

          <div className="login-metrics">
            <article className="metric-card">
              <span className="metric-value">Servicios</span>
              <span className="metric-label">Estado y progreso en tiempo real</span>
            </article>
            <article className="metric-card">
              <span className="metric-value">Equipo</span>
              <span className="metric-label">Asignación y carga operativa</span>
            </article>
            <article className="metric-card">
              <span className="metric-value">Historial</span>
              <span className="metric-label">Contexto por cliente y moto</span>
            </article>
          </div>

          <div className="login-feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-speedometer2"></i>
              </div>
              <div>
                <strong>Vista de operación</strong>
                <p>Prioriza ingresos, avances y entregas con menos ruido visual.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-people"></i>
              </div>
              <div>
                <strong>Contexto unificado</strong>
                <p>Cliente, moto y servicio en el mismo flujo de trabajo.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-diagram-3"></i>
              </div>
              <div>
                <strong>Decisión administrativa</strong>
                <p>Más control para coordinar taller y oficina con precisión.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-shell">
          <div className="login-card">
            <div className="login-card-head">
              <div className="login-card-brand">
                <div className="login-card-logo-wrap">
                  <img src={logo} alt="Logo KTM Rocket Service" className="login-card-logo" />
                </div>
                <div>
                  <p className="login-card-kicker">Rider Access</p>
                  <h2>Iniciar sesión</h2>
                </div>
              </div>
              <p className="login-card-copy">
                Usa tus credenciales administrativas para entrar al panel principal.
              </p>
            </div>

            {serverError && (
              <div className="error-alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{serverError}</span>
              </div>
            )}

<form className="login-form" onSubmit={handleSubmit(onSubmit)} key="login-form-clean">
  <div className="form-group">
    <label className="form-label" htmlFor="usuario">
      Rider ID
    </label>
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
    </div>
    {errors.usuario && (
      <p className="field-error">{errors.usuario.message}</p>
    )}
  </div>

  <div className="form-group">
    <label className="form-label" htmlFor="contrasena">
      Clave de acceso
    </label>
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
    </div>
    {errors.contrasena && (
      <p className="field-error">{errors.contrasena.message}</p>
    )}
  </div>

  <div className="login-meta-row">
    <span className="meta-chip">
      <i className="bi bi-cpu"></i>
      Acceso administrativo
    </span>
    <span className="meta-chip">
      <i className="bi bi-lock"></i>
      Sesión segura
    </span>
  </div>

  <button type="submit" className="btn-ktm login-submit" disabled={loading}>
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