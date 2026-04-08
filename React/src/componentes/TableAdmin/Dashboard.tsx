import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerAdmins,
  type AdminRecord,
} from '../../services/adminService';
import {
  obtenerProductos,
  type ProductoRecord,
} from '../../services/productosService';
import {
  obtenerServicios,
  type ServicioPayload,
} from '../../services/serviciosService';
import {
  obtenerTecnicos,
  type TecnicoRecord,
} from '../../services/tecnicosService';
import './Dashboard.css';

interface DashboardStats {
  admins: number;
  tecnicos: number;
  productos: number;
  servicios: number;
  productosAgotados: number;
  serviciosDisponibles: number;
}

const extractAdmins = (payload: unknown): AdminRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    const fromData = extractAdmins(nested.data);
    if (fromData) return fromData;
    const fromAdmins = extractAdmins(nested.admins);
    if (fromAdmins) return fromAdmins;
  }
  return [];
};

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

const extractTecnicos = (payload: unknown): TecnicoRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    const fromData = extractTecnicos(nested.data);
    if (fromData) return fromData;
    const fromTecnicos = extractTecnicos(nested.tecnicos);
    if (fromTecnicos) return fromTecnicos;
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

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    admins: 0,
    tecnicos: 0,
    productos: 0,
    servicios: 0,
    productosAgotados: 0,
    serviciosDisponibles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      const [adminsRes, tecnicosRes, productosRes, serviciosRes] = await Promise.all([
        obtenerAdmins().catch(() => ({ data: [] })),
        obtenerTecnicos().catch(() => ({ data: [] })),
        obtenerProductos().catch(() => ({ data: [] })),
        obtenerServicios().catch(() => ({ data: [] })),
      ]);

      const admins = extractAdmins(adminsRes.data);
      const tecnicos = extractTecnicos(tecnicosRes.data);
      const productos = extractProductos(productosRes.data);
      const servicios = extractServicios(serviciosRes.data);

      const productosAgotados = productos.filter(
        p => p.Estado === 'Agotados' || p.Cantidad === 0
      ).length;

      const serviciosDisponibles = servicios.filter(
        s => s.Estado === 'Disponible'
      ).length;

      setStats({
        admins: admins.length,
        tecnicos: tecnicos.length,
        productos: productos.length,
        servicios: servicios.length,
        productosAgotados,
        serviciosDisponibles,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    onClick,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      className="stat-card"
      style={{ borderLeftColor: color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-icon" style={{ color }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Panel de Control</h1>
        </div>

        {loading ? (
          <div className="loading-container">
            <p className="loading-text">Cargando estadísticas...</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                title="Administradores"
                value={stats.admins}
                icon="bi-shield-check"
                color="#ff6600"
                onClick={() => navigate('/admin/administradores')}
              />
              <StatCard
                title="Técnicos"
                value={stats.tecnicos}
                icon="bi-person-badge"
                color="#ffd166"
                onClick={() => navigate('/admin/tecnicos')}
              />
              <StatCard
                title="Productos"
                value={stats.productos}
                icon="bi-box-seam"
                color="#00d4ff"
                onClick={() => navigate('/admin/productos')}
              />
              <StatCard
                title="Servicios"
                value={stats.servicios}
                icon="bi-tools"
                color="#00ff88"
                onClick={() => navigate('/admin/servicios')}
              />
              <StatCard
                title="Productos Agotados"
                value={stats.productosAgotados}
                icon="bi-exclamation-triangle"
                color="#ff3333"
              />
            </div>

            <div className="info-section">
              <div className="info-card">
                <h3>📊 Resumen del Sistema</h3>
                <ul className="info-list">
                  <li>
                    <span className="info-label">Total de Administradores:</span>
                    <span className="info-value">{stats.admins}</span>
                  </li>
                  <li>
                    <span className="info-label">Total de Técnicos:</span>
                    <span className="info-value">{stats.tecnicos}</span>
                  </li>
                  <li>
                    <span className="info-label">Total de Productos:</span>
                    <span className="info-value">{stats.productos}</span>
                  </li>
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
                    <span className="info-label">Total de Servicios:</span>
                    <span className="info-value">{stats.servicios}</span>
                  </li>
                  <li>
                    <span className="info-label">Servicios Disponibles:</span>
                    <span className="info-value info-positive">{stats.serviciosDisponibles}</span>
                  </li>
                </ul>
              </div>

              <div className="info-card">
                <h3>⚡ Útil</h3>
                <p className="info-text">
                  Este panel te proporciona un resumen rápido de todas las operaciones del sistema.
                  Desde aquí puedes acceder a las diferentes secciones para gestionar administradores,
                  productos y servicios.
                </p>
                <p className="info-text">
                  Haz clic en cualquier tarjeta de estadísticas para navegar a la sección correspondiente.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
