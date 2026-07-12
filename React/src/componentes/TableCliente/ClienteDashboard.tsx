import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerMotos, type MotoRecord } from '../../services/moto.service';
import { obtenerOrdenes, type OrdenServicioRecord } from '../../services/ordenServicioService';
import { clearSession } from '../../services/auth.services'; // Asegúrate que el archivo se llama así
import '../TableAdmin/Dashboard.css';
import { formatId } from '../../utils/formatIds';

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
  const navigate = useNavigate();
  const location = useLocation();
  const isIndex = location.pathname === '/cliente' || location.pathname === '/cliente/' || location.pathname === '/cliente/dashboard';
  
  // 🔴 AQUÍ ES DONDE BUSCAMOS EL ID
  const clienteId = localStorage.getItem('user_id') || '';
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
      
      const motosRes = await obtenerMotos().catch(() => ({ data: [] }));
      const motos = extraerMotos(motosRes.data);
      const motosCliente = motos.filter(m => String(m.ID_CLIENTES) === String(clienteId));

      const ordenesRes = await obtenerOrdenes().catch(() => ({ data: [] }));
      const ordenes = extraerOrdenes(ordenesRes.data);
      const ordenesCliente = ordenes.filter(o => String(o.ID_CLIENTES) === String(clienteId));

      const completadas = ordenesCliente.filter(o => ['Completado', 'completado'].includes(o.Estado)).length;
      const pendientes = ordenesCliente.filter(o => 
        ['Pendiente', 'En proceso', 'pendiente', 'en proceso'].includes(o.Estado)
      ).length;

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
    } finally {
      setLoading(false);
    }
  };

  const extraerMotos = (payload: unknown): MotoRecord[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const nested = payload as Record<string, unknown>;
      const fromData = extraerMotos(nested.data);
      if (fromData.length > 0) return fromData;
      const fromMotos = extraerMotos(nested.motos);
      if (fromMotos.length > 0) return fromMotos;
    }
    return [];
  };

  const extraerOrdenes = (payload: unknown): OrdenServicioRecord[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const nested = payload as Record<string, unknown>;
      const fromData = extraerOrdenes(nested.data);
      if (fromData.length > 0) return fromData;
      const fromOrdenes = extraerOrdenes(nested.ordenes);
      if (fromOrdenes.length > 0) return fromOrdenes;
    }
    return [];
  };


  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Tu sesión será cerrada y deberás iniciar sesión nuevamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) clearSession();
    });
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ color }}><i className={`bi ${icon}`}></i></div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const getEstadoColor = (estado: string): string => {
    const e = estado.toLowerCase();
    if (e === 'completado') return '#00ff88';
    if (e === 'en proceso') return '#ffd166';
    if (e === 'pendiente') return '#ff6600';
    return '#666';
  };

  const getProgress = (estado: string): number => {
    const e = estado.toLowerCase();
    if (e === 'completado') return 100;
    if (e === 'en proceso') return 50;
    return 15; // Pendiente
  };

  return (
    <div className="dashboard-page" style={{ padding: 0 }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '15px 30px', background: 'var(--ktm-dark-card)', borderBottom: '1px solid #333', marginBottom: '20px', borderRadius: 0 }}>
        <div>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ktm-orange)' }}>Bienvenido, {clienteNombre}</h1>
          <p className="dashboard-subtitle" style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>Panel de Control del Cliente</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => navigate('/carrito')} style={{
            background: '#ff6600', border: '2px solid #ff6600', color: '#fff',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
          }}>
            <i className="bi bi-cart3"></i> Ir al Carrito
          </button>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '2px solid #ff6600', color: '#ff6600',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
          }}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="dashboard-section" style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
        {isIndex ? (
          loading ? (
            <div className="loading-container"><p className="loading-text">Cargando tu información...</p></div>
          ) : (
            <>
              <div className="quick-actions">
                <h3 className="actions-title">Acciones Rápidas</h3>
                <div className="actions-grid">
                  <button className="action-btn action-btn-primary" onClick={() => navigate('/cliente/ordenes')}>
                    <i className="bi bi-clipboard-check"></i> Ver Órdenes
                  </button>
                  <button className="action-btn action-btn-secondary" onClick={() => navigate('/cliente/motos')}>
                    <i className="bi bi-bicycle"></i> Mis Motos
                  </button>
                  <button className="action-btn action-btn-tertiary" onClick={() => navigate('/cliente/comprobantes')}>
                    <i className="bi bi-receipt"></i> Comprobantes
                  </button>
                  <button className="action-btn action-btn-quaternary" onClick={() => navigate('/cliente/historial')}>
                    <i className="bi bi-journal-text"></i> Historial
                  </button>
                </div>
              </div>

              <div className="info-section">
                <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                  <h3><i className="bi bi-rocket-takeoff" style={{ marginRight: '8px' }}></i> Seguimiento de Órdenes</h3>
                  {ordenesRecientes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                      {ordenesRecientes.map((orden) => {
                        const progress = getProgress(orden.Estado);
                        const color = getEstadoColor(orden.Estado);
                        return (
                          <div key={orden.ID_ORDEN_SERVICIO} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <strong style={{ color: '#ff6600', fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {formatId('orden', orden.ID_ORDEN_SERVICIO)}
                                </strong>
                                <span style={{ color: '#888', marginLeft: '15px', fontSize: '0.9rem' }}>
                                  <i className="bi bi-calendar-event me-1"></i>
                                  Inicio: {new Date(orden.Fecha_inicio).toLocaleDateString('es-CO')}
                                </span>
                              </div>
                              <span style={{ 
                                padding: '6px 14px', 
                                borderRadius: '20px', 
                                backgroundColor: `${color}15`, 
                                color: color, 
                                fontWeight: 'bold', 
                                fontSize: '0.85rem', 
                                border: `1px solid ${color}40`,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>
                                {orden.Estado}
                              </span>
                            </div>
                            
                            {/* Progress Bar Container */}
                            <div style={{ position: 'relative', height: '10px', background: '#2a2a2a', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #333' }}>
                              <div style={{ 
                                position: 'absolute', top: 0, left: 0, height: '100%', 
                                width: `${progress}%`, 
                                background: `linear-gradient(90deg, ${color}99, ${color})`,
                                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 0 10px ${color}80`
                              }}></div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                              <span style={{ color: progress >= 15 ? '#ddd' : '#666' }}>Recepcionada</span>
                              <span style={{ color: progress >= 50 ? '#ddd' : '#666' }}>En Taller</span>
                              <span style={{ color: progress >= 100 ? '#ddd' : '#666' }}>Lista para Entrega</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '10px', display: 'block', color: '#444' }}></i>
                      <p>No tienes órdenes de servicio activas en este momento.</p>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h3>📊 Resumen de tu Cuenta</h3>
                  <ul className="info-list">
                    <li><span className="info-label">Total de Órdenes:</span><span className="info-value">{stats.totalOrdenes}</span></li>
                    <li><span className="info-label">Completadas:</span><span className="info-value info-positive">{stats.ordenesCompletadas}</span></li>
                    <li><span className="info-label">Pendientes:</span><span className="info-value info-negative">{stats.ordenesPendientes}</span></li>
                    <li><span className="info-label">Motos Registradas:</span><span className="info-value">{stats.totalMotos}</span></li>
                  </ul>
                </div>
              </div>
            </>
          )
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}

export default ClienteDashboard;