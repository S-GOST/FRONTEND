import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerMotos, insertarMoto, type MotoRecord, type MotoPayload } from '../../services/moto.service';
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
  
  // Estado para registro de moto
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [motoForm, setMotoForm] = useState<Partial<MotoPayload>>({
    Placa: '',
    Modelo: '',
    Marca: '',
    Recorrido: 0
  });

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

   const handleRegistrarMoto = async () => {
    // 🔴 Validación 1: ID de sesión
    if (!clienteId || clienteId === 'undefined' || clienteId === '') {
      Swal.fire('⚠️ Error de Sesión', 'No se encontró tu ID de usuario. Cierra sesión e inicia nuevamente.', 'error');
      return;
    }

    // 🔴 Validación 2: Campos obligatorios
    if (!motoForm.Placa?.trim() || !motoForm.Modelo?.trim() || !motoForm.Marca?.trim()) {
      Swal.fire('⚠️ Atención', 'Placa, Modelo y Marca son obligatorios.', 'warning');
      return;
    }

    try {
      // ✅ 1. Crear el payload con los valores ACTUALES del formulario
      const payload = {
        ID_CLIENTES: clienteId,
        Placa: motoForm.Placa!.toUpperCase(),
        Modelo: motoForm.Modelo!,
        Marca: motoForm.Marca!,
        Recorrido: Number(motoForm.Recorrido) || 0
      };

      console.log("📤 Enviando payload a la API:", payload);

      // ✅ 2. Llamar a la API y capturar la respuesta completa
      const res = await insertarMoto(payload as any);

      // ✅ 3. Extraer los datos de la moto creada (adaptable a cualquier estructura de respuesta)
      const nuevaMoto = res?.data?.data || res?.data || {};

      // ✅ 4. Mostrar éxito con ID profesional
      Swal.fire({
        title: '✅ Registrada',
        html: `Tu motocicleta <strong>${formatId('moto', nuevaMoto.ID_MOTOS)}</strong> ha sido enviada a administración.`,
        icon: 'success',
        confirmButtonColor: '#ff6600'
      });

      // ✅ 5. Limpiar estado y recargar
      setShowMotoModal(false);
      setMotoForm({ Placa: '', Modelo: '', Marca: '', Recorrido: 0 });
      await cargarEstadisticas();
    } catch (err: any) {
      const backendMsg = err.response?.data?.message || err.message || 'Error desconocido del servidor.';
      Swal.fire('❌ Error', `El servidor falló:\n${backendMsg}`, 'error');
      console.error("Error completo:", err);
    }
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
                  <button className="action-btn action-btn-secondary" onClick={() => setShowMotoModal(true)}>
                    <i className="bi bi-plus-circle"></i> Registrar Moto
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

      {/* MODAL REGISTRAR MOTO */}
      {showMotoModal && (
        <div className="modal-overlay" onClick={() => setShowMotoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-plus-circle"></i> Registrar Motocicleta</h3>
              <button className="modal-close" onClick={() => setShowMotoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Placa</label>
                <input type="text" value={motoForm.Placa || ''} onChange={e => setMotoForm({...motoForm, Placa: e.target.value})} placeholder="Ej: ABC-123" />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input type="text" value={motoForm.Marca || ''} onChange={e => setMotoForm({...motoForm, Marca: e.target.value})} placeholder="Ej: KTM, Honda, Yamaha" />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input type="text" value={motoForm.Modelo || ''} onChange={e => setMotoForm({...motoForm, Modelo: e.target.value})} placeholder="Ej: Duke 390, CBR 500R" />
              </div>
              <div className="form-group">
                <label>Recorrido (km)</label>
                <input type="number" value={motoForm.Recorrido || ''} onChange={e => setMotoForm({...motoForm, Recorrido: Number(e.target.value)})} placeholder="0" />
              </div>
              <button className="btn-guardar" onClick={handleRegistrarMoto}>
                <i className="bi bi-check-circle"></i> Enviar a Administración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteDashboard;