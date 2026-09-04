import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerMotos, type MotoRecord } from '../../services/moto.service';
import { obtenerMisOrdenes, type OrdenServicioRecord } from '../../services/ordenServicioService';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      const motosRes = await obtenerMotos().catch(() => ({ data: [] }));
      const motos = extraerMotos(motosRes.data);
      const motosCliente = motos.filter(m => String(m.id_cliente ?? m.ID_CLIENTES ?? '') === String(clienteId));

      const ordenesRes = await obtenerMisOrdenes().catch(() => ({ data: [] }));
      const ordenesCliente = extraerOrdenes(ordenesRes.data);

      const completadas = ordenesCliente.filter(o => ['Completado', 'completado'].includes(o.Estado)).length;
      const pendientes = ordenesCliente.filter(o => 
        ['Pendiente', 'En proceso', 'pendiente', 'en proceso', 'En_proceso', 'en_proceso'].includes(o.Estado)
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



  const getEstadoColor = (estado: string): string => {
    if (!estado) return '#666';
    const e = String(estado).toLowerCase().trim();
    if (e.includes('completad') || e.includes('finalizad')) return '#00ff88';
    if (e.includes('proceso')) return '#ffd166';
    if (e.includes('pendient')) return '#ff6600';
    if (e.includes('cancelad')) return '#ff4444';
    return '#666';
  };

  const getProgress = (estado: string): number => {
    if (!estado) return 15;
    const e = String(estado).toLowerCase().trim();
    if (e.includes('completad') || e.includes('finalizad')) return 100;
    if (e.includes('proceso')) return 50;
    return 15; // Pendiente o default
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
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ '--card-color': '#00d4ff' } as React.CSSProperties}>
                  <div className="stat-icon" style={{ color: '#00d4ff', background: `linear-gradient(135deg, #00d4ff22, #00d4ff05)` }}><i className="bi bi-clipboard-data"></i></div>
                  <div className="stat-content">
                    <h3 className="stat-title">Total Órdenes</h3>
                    <p className="stat-value">{stats.totalOrdenes}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#10b981' } as React.CSSProperties}>
                  <div className="stat-icon" style={{ color: '#10b981', background: `linear-gradient(135deg, #10b98122, #10b98105)` }}><i className="bi bi-check-circle"></i></div>
                  <div className="stat-content">
                    <h3 className="stat-title">Completadas</h3>
                    <p className="stat-value">{stats.ordenesCompletadas}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#ff6600' } as React.CSSProperties}>
                  <div className="stat-icon" style={{ color: '#ff6600', background: `linear-gradient(135deg, #ff660022, #ff660005)` }}><i className="bi bi-clock-history"></i></div>
                  <div className="stat-content">
                    <h3 className="stat-title">Pendientes</h3>
                    <p className="stat-value">{stats.ordenesPendientes}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#ffd166' } as React.CSSProperties}>
                  <div className="stat-icon" style={{ color: '#ffd166', background: `linear-gradient(135deg, #ffd16622, #ffd16605)` }}><i className="bi bi-bicycle"></i></div>
                  <div className="stat-content">
                    <h3 className="stat-title">Mis Motos</h3>
                    <p className="stat-value">{stats.totalMotos}</p>
                  </div>
                </div>
              </div>
              <div className="quick-actions">
                <h3 className="actions-title">Acciones Rápidas</h3>
                <div className="actions-grid">
                  <button className="action-btn" onClick={() => navigate('/cliente/ordenes')}>
                    <div className="action-icon-wrapper" style={{ color: '#00d4ff', background: `linear-gradient(135deg, #00d4ff22, #00d4ff05)` }}>
                      <i className="bi bi-clipboard-check"></i>
                    </div>
                    <span className="action-title">Ver Órdenes</span>
                  </button>
                  <button className="action-btn" onClick={() => navigate('/cliente/motos')}>
                    <div className="action-icon-wrapper" style={{ color: '#ffd166', background: `linear-gradient(135deg, #ffd16622, #ffd16605)` }}>
                      <i className="bi bi-bicycle"></i>
                    </div>
                    <span className="action-title">Mis Motos</span>
                  </button>
                  <button className="action-btn" onClick={() => navigate('/cliente/comprobantes')}>
                    <div className="action-icon-wrapper" style={{ color: '#00ff88', background: `linear-gradient(135deg, #00ff8822, #00ff8805)` }}>
                      <i className="bi bi-receipt"></i>
                    </div>
                    <span className="action-title">Comprobantes</span>
                  </button>
                  <button className="action-btn" onClick={() => navigate('/cliente/historial')}>
                    <div className="action-icon-wrapper" style={{ color: '#ff6600', background: `linear-gradient(135deg, #ff660022, #ff660005)` }}>
                      <i className="bi bi-journal-text"></i>
                    </div>
                    <span className="action-title">Historial</span>
                  </button>
                </div>
              </div>

              <div className="info-section" style={{ gridTemplateColumns: '1fr' }}>
                <div className="info-card">
                  <h3><i className="bi bi-rocket-takeoff" style={{ marginRight: '8px', color: 'var(--dashboard-accent)' }}></i> Seguimiento de Órdenes Recientes</h3>
                  {ordenesRecientes.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                      {ordenesRecientes.map((orden) => {
                        const progress = getProgress(orden.Estado);
                        const color = getEstadoColor(orden.Estado);
                        return (
                          <div key={orden.ID_ORDEN_SERVICIO} style={{ background: 'linear-gradient(145deg, #111111, #050505)', borderRadius: '12px', padding: '20px', border: '1px solid #1a1a1a', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.3s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <strong style={{ color: '#fff', fontSize: '1.2rem', display: 'block', marginBottom: '5px' }}>
                                  Orden {formatId('orden', orden.ID_ORDEN_SERVICIO)}
                                </strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Inicio: {new Date(orden.Fecha_inicio).toLocaleDateString('es-CO')}
                                  </span>
                                  {orden.Fecha_estimada && (
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                      <i className="bi bi-calendar-check me-2"></i>
                                      Est. Entrega: {new Date(orden.Fecha_estimada).toLocaleDateString('es-CO')}
                                    </span>
                                  )}
                                  {orden.Fecha_fin && (
                                    <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
                                      <i className="bi bi-calendar-check-fill me-2"></i>
                                      Finalizado: {new Date(orden.Fecha_fin).toLocaleDateString('es-CO')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span style={{ 
                                padding: '6px 14px', 
                                borderRadius: '20px', 
                                backgroundColor: `${color}15`, 
                                color: color, 
                                fontWeight: 'bold', 
                                fontSize: '0.8rem', 
                                border: `1px solid ${color}40`,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {orden.Estado}
                              </span>
                            </div>
                            
                            {/* Progress Bar Container */}
                            <div style={{ position: 'relative', height: '8px', background: '#2a2a2a', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #1f1f1f' }}>
                              <div style={{ 
                                position: 'absolute', top: 0, left: 0, height: '100%', 
                                width: `${progress}%`, 
                                background: `linear-gradient(90deg, ${color}99, ${color})`,
                                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 0 10px ${color}80`
                              }}></div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                              <span style={{ color: progress >= 15 ? '#ddd' : '#666' }}>Recepcionada</span>
                              <span style={{ color: progress >= 50 ? '#ddd' : '#666' }}>En Taller</span>
                              <span style={{ color: progress >= 100 ? '#ddd' : '#666' }}>Lista</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', background: 'linear-gradient(145deg, #111111, #050505)', borderRadius: '12px', border: '1px dashed #333' }}>
                      <div style={{ background: '#1a1a1a', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                        <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: '#555' }}></i>
                      </div>
                      <p style={{ fontSize: '1.1rem', margin: 0 }}>No tienes órdenes de servicio recientes.</p>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Las órdenes activas aparecerán aquí para que puedas darles seguimiento.</p>
                    </div>
                  )}
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