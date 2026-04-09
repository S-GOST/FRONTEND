import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { obtenerMotos, type MotoRecord } from '../../services/motosService';
import { obtenerOrdenes, type OrdenServicioRecord } from '../../services/ordenServicioService';
import '../TableAdmin/Dashboard.css';

interface ClienteStats {
  totalOrdenes: number;
  ordenesCompletadas: number;
  ordenesPendientes: number;
  totalMotos: number;
}

interface OrdenReciente extends OrdenServicioRecord {
  Modelo?: string;
}

function ClienteDashboard() {
  const clienteId = localStorage.getItem('user_id');
  const clienteNombre = localStorage.getItem('user_name') || 'Cliente';
  
  const [stats, setStats] = useState<ClienteStats>({
    totalOrdenes: 0,
    ordenesCompletadas: 0,
    ordenesPendientes: 0,
    totalMotos: 0,
  });
  const [ordenesRecientes, setOrdenesRecientes] = useState<OrdenReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Obtener motos del cliente
      const motosRes = await obtenerMotos().catch(() => ({ data: [] }));
      const motos = extraerMotos(motosRes.data);
      const motosCliente = motos.filter(m => String(m.ID_CLIENTES) === String(clienteId));

      // Obtener órdenes del cliente
      const ordenesRes = await obtenerOrdenes().catch(() => ({ data: [] }));
      const ordenes = extraerOrdenes(ordenesRes.data);
      const ordenesCliente = ordenes.filter(o => String(o.ID_CLIENTES) === String(clienteId));

      // Filtrar por estado
      const completadas = ordenesCliente.filter(o => o.Estado === 'Completado' || o.Estado === 'completado').length;
      const pendientes = ordenesCliente.filter(o => 
        o.Estado === 'Pendiente' || o.Estado === 'En proceso' || 
        o.Estado === 'pendiente' || o.Estado === 'en proceso'
      ).length;

      // Obtener órdenes recientes (últimas 3)
      const recientes = ordenesCliente
        .sort((a, b) => new Date(b.Fecha_inicio).getTime() - new Date(a.Fecha_inicio).getTime())
        .slice(0, 3);

      setStats({
        totalOrdenes: ordenesCliente.length,
        ordenesCompletadas: completadas,
        ordenesPendientes: pendientes,
        totalMotos: motosCliente.length,
      });
      setOrdenesRecientes(recientes);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las estadísticas',
        icon: 'error',
        confirmButtonColor: '#FF6D1F',
      });
    } finally {
      setLoading(false);
    }
  };

  const extraerMotos = (payload: unknown): MotoRecord[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const nested = payload as Record<string, unknown>;
      const fromData = extraerMotos(nested.data);
      if (fromData) return fromData;
      const fromMotos = extraerMotos(nested.motos);
      if (fromMotos) return fromMotos;
    }
    return [];
  };

  const extraerOrdenes = (payload: unknown): OrdenServicioRecord[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const nested = payload as Record<string, unknown>;
      const fromData = extraerOrdenes(nested.data);
      if (fromData) return fromData;
      const fromOrdenes = extraerOrdenes(nested.ordenes);
      if (fromOrdenes) return fromOrdenes;
    }
    return [];
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <div
      className="stat-card"
      style={{ borderLeftColor: color }}
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

  const getEstadoColor = (estado: string): string => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === 'completado') return '#00ff88';
    if (estadoLower === 'en proceso') return '#ffd166';
    if (estadoLower === 'pendiente') return '#ff6600';
    return '#666';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Bienvenido, {clienteNombre}</h1>
          <p style={{ color: '#999', marginTop: '5px' }}>Panel de Control del Cliente</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <p className="loading-text">Cargando tu información...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Estadísticas */}
            <div className="stats-grid">
              <StatCard
                title="Total de Órdenes"
                value={stats.totalOrdenes}
                icon="bi-clipboard-list"
                color="#ff6600"
              />
              <StatCard
                title="Órdenes Completadas"
                value={stats.ordenesCompletadas}
                icon="bi-check-circle"
                color="#00ff88"
              />
              <StatCard
                title="Órdenes Pendientes"
                value={stats.ordenesPendientes}
                icon="bi-hourglass-split"
                color="#ffd166"
              />
              <StatCard
                title="Mis Motos"
                value={stats.totalMotos}
                icon="bi-motorcycle"
                color="#00d4ff"
              />
            </div>

            {/* Contenido Principal */}
            <div className="info-section">
              {/* Sección de Órdenes Recientes */}
              <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '20px' }}>
                  <i className="bi bi-clock-history" style={{ marginRight: '8px' }}></i>
                  Órdenes Recientes
                </h3>
                {ordenesRecientes.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #333' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#ff6600' }}>ID Orden</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#ff6600' }}>Fecha Inicio</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#ff6600' }}>Fecha Estimada</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#ff6600' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesRecientes.map((orden) => (
                          <tr key={orden.ID_ORDEN_SERVICIO} style={{ borderBottom: '1px solid #444' }}>
                            <td style={{ padding: '12px' }}>{orden.ID_ORDEN_SERVICIO}</td>
                            <td style={{ padding: '12px' }}>
                              {new Date(orden.Fecha_inicio).toLocaleDateString('es-ES')}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {new Date(orden.Fecha_estimada).toLocaleDateString('es-ES')}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                backgroundColor: getEstadoColor(orden.Estado),
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '12px',
                              }}>
                                {orden.Estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No tienes órdenes aún</p>
                )}
              </div>

              {/* Resumen */}
              <div className="info-card">
                <h3>📊 Resumen de tu Cuenta</h3>
                <ul className="info-list">
                  <li>
                    <span className="info-label">Total de Órdenes:</span>
                    <span className="info-value">{stats.totalOrdenes}</span>
                  </li>
                  <li>
                    <span className="info-label">Completadas:</span>
                    <span className="info-value info-positive">{stats.ordenesCompletadas}</span>
                  </li>
                  <li>
                    <span className="info-label">Pendientes:</span>
                    <span className="info-value info-negative">{stats.ordenesPendientes}</span>
                  </li>
                  <li>
                    <span className="info-label">Motos Registradas:</span>
                    <span className="info-value">{stats.totalMotos}</span>
                  </li>
                </ul>
              </div>

              {/* Información */}
              <div className="info-card">
                <h3>ℹ️ Información Útil</h3>
                <p className="info-text">
                  Este panel te proporciona un resumen de tu cuenta y órdenes de servicio.
                </p>
                <p className="info-text">
                  <strong>Puedes:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                  <li>Ver tus órdenes de servicio</li>
                  <li>Registrar y gestionar tus motos</li>
                  <li>Consultar servicios disponibles</li>
                  <li>Actualizar tu perfil</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ClienteDashboard;
