import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerProductos,
  type ProductoRecord,
} from '../../services/productosService';
import {
  obtenerServicios,
  type ServicioPayload,
} from '../../services/serviciosService';
import './TecnicoDashboard.css'; // Archivo CSS mejorado

interface TecnicoDashboardStats {
  tecnicos: number;
  productos: number;
  servicios: number;
  productosAgotados: number;
  serviciosDisponibles: number;
}

const extractProductos = (payload: unknown): ProductoRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    const fromData = extractProductos(nested.data);
    if (fromData) return fromData;
    const fromProductos = extractProductos(nested.productos);
    if (fromProductos) return fromProductos;
  }
  return [];
};

const extractServicios = (payload: unknown): ServicioPayload[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    const fromData = extractServicios(nested.data);
    if (fromData) return fromData;
    const fromServicios = extractServicios(nested.servicios);
    if (fromServicios) return fromServicios;
  }
  return [];
};

const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TecnicoDashboardStats>({
    tecnicos: 0,
    productos: 0,
    servicios: 0,
    productosAgotados: 0,
    serviciosDisponibles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productosRes, serviciosRes] = await Promise.all([
        obtenerProductos().catch(() => ({ data: [] })),
        obtenerServicios().catch(() => ({ data: [] })),
      ]);

      const productos = extractProductos(productosRes.data);
      const servicios = extractServicios(serviciosRes.data);

      const productosAgotados = productos.filter(
        p => p.Estado === 'Agotados' || p.Cantidad === 0
      ).length;

      const serviciosDisponibles = servicios.filter(
        s => s.Estado === 'Disponible'
      ).length;

      setStats({
        tecnicos: 1,
        productos: productos.length,
        servicios: servicios.length,
        productosAgotados,
        serviciosDisponibles,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('No se pudieron cargar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_name');
      navigate('/login');
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    gradient,
    onClick,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    gradient?: string;
    onClick?: () => void;
  }) => (
    <div
      className="stat-card"
      style={{ background: gradient || color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-card">
          <i className="bi bi-exclamation-circle"></i>
          <h2>Error</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={cargarEstadisticas}>
            <i className="bi bi-arrow-repeat"></i> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tecnico-dashboard">
      {/* Header con botón de cerrar sesión */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>
              <i className="bi bi-speedometer2"></i> Panel Técnico
            </h1>
            <p>Bienvenido al sistema de gestión KTM Motos</p>
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="dashboard-main">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando estadísticas...</p>
          </div>
        ) : (
          <>
            <section className="stats-section">
              <h2 className="section-title">Resumen General</h2>
              <div className="stats-grid">
                <StatCard
                  title="Productos Disponibles"
                  value={stats.productos - stats.productosAgotados}
                  icon="bi-box-seam"
                  color="#00d4ff"
                  gradient="linear-gradient(135deg, #00d4ff, #0099cc)"
                />
                <StatCard
                  title="Servicios Disponibles"
                  value={stats.serviciosDisponibles}
                  icon="bi-tools"
                  color="#00ff88"
                  gradient="linear-gradient(135deg, #00ff88, #00cc66)"
                />
                <StatCard
                  title="Productos Agotados"
                  value={stats.productosAgotados}
                  icon="bi-exclamation-triangle"
                  color="#ff4d4d"
                  gradient="linear-gradient(135deg, #ff4d4d, #cc0000)"
                />
              </div>
            </section>

            <section className="quick-actions-section">
              <h2 className="section-title">Acciones Rápidas</h2>
              <div className="actions-grid">
                <button
                  className="action-card"
                  onClick={() => navigate('/tecnico/productos')}
                >
                  <div className="action-icon">
                    <i className="bi bi-box-seam"></i>
                  </div>
                  <div className="action-info">
                    <h3>Ver Productos</h3>
                    <p>Gestionar inventario</p>
                  </div>
                  <i className="bi bi-chevron-right arrow-icon"></i>
                </button>
                <button
                  className="action-card"
                  onClick={() => navigate('/tecnico/servicios')}
                >
                  <div className="action-icon">
                    <i className="bi bi-tools"></i>
                  </div>
                  <div className="action-info">
                    <h3>Ver Servicios</h3>
                    <p>Consultar disponibilidad</p>
                  </div>
                  <i className="bi bi-chevron-right arrow-icon"></i>
                </button>
                <button
                  className="action-card refresh-card"
                  onClick={cargarEstadisticas}
                >
                  <div className="action-icon">
                    <i className="bi bi-arrow-clockwise"></i>
                  </div>
                  <div className="action-info">
                    <h3>Actualizar Datos</h3>
                    <p>Refrescar estadísticas</p>
                  </div>
                  <i className="bi bi-chevron-right arrow-icon"></i>
                </button>
              </div>
            </section>

            <section className="info-section">
              <div className="info-panel">
                <h3>
                  <i className="bi bi-info-circle"></i> Detalles del Inventario
                </h3>
                <ul className="info-list">
                  <li>
                    <span className="info-label">Productos Disponibles:</span>
                    <span className="info-value info-positive">
                      {stats.productos - stats.productosAgotados}
                    </span>
                  </li>
                  <li>
                    <span className="info-label">Productos Agotados:</span>
                    <span className="info-value info-negative">{stats.productosAgotados}</span>
                  </li>
                  <li>
                    <span className="info-label">Servicios Disponibles:</span>
                    <span className="info-value info-positive">{stats.serviciosDisponibles}</span>
                  </li>
                  <li>
                    <span className="info-label">Total de Servicios:</span>
                    <span className="info-value">{stats.servicios}</span>
                  </li>
                </ul>
              </div>

              <div className="info-panel">
                <h3>
                  <i className="bi bi-person-workspace"></i> Funciones del Técnico
                </h3>
                <p>
                  Como técnico, puedes consultar la disponibilidad de productos y servicios
                  del sistema KTM Motos. Utiliza las tarjetas de estadísticas para obtener
                  información rápida sobre el inventario.
                </p>
                <p>
                  Mantén actualizada la información del sistema para ofrecer el mejor servicio
                  a nuestros clientes.
                </p>
                <div className="tech-tip">
                  <i className="bi bi-lightbulb"></i>
                  <span>Consejo: Actualiza los datos periódicamente para ver cambios en tiempo real.</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default TecnicoDashboard;