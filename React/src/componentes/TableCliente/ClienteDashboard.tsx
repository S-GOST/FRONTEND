import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerMotos, crearMoto, type MotoRecord, type MotoPayload } from '../../services/moto.service';
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
      const res = await crearMoto(payload as any);

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

  return (
    <div className="dashboard-page">
      <div className="dashboard-section">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="dashboard-title">Bienvenido, {clienteNombre}</h1>
            <p className="dashboard-subtitle">Panel de Control del Cliente</p>
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '2px solid #ff6600', color: '#ff6600',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
          }}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>

        {loading ? (
          <div className="loading-container"><p className="loading-text">Cargando tu información...</p></div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard title="Total de Órdenes" value={stats.totalOrdenes} icon="bi-clipboard-list" color="#ff6600" />
              <StatCard title="Órdenes Completadas" value={stats.ordenesCompletadas} icon="bi-check-circle" color="#00ff88" />
              <StatCard title="Órdenes Pendientes" value={stats.ordenesPendientes} icon="bi-hourglass-split" color="#ffd166" />
              <StatCard title="Mis Motos" value={stats.totalMotos} icon="bi-motorcycle" color="#00d4ff" />
            </div>

            <div className="quick-actions">
              <h3 className="actions-title">Acciones Rápidas</h3>
              <div className="actions-grid">
                <button className="action-btn action-btn-primary" onClick={() => navigate('/cliente/ordenes')}>
                  <i className="bi bi-clipboard-check"></i> Ver Órdenes
                </button>
                <button className="action-btn action-btn-secondary" onClick={() => setShowMotoModal(true)}>
                  <i className="bi bi-motorcycle"></i> Registrar Moto
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
              <div className="info-card">
                <h3><i className="bi bi-clock-history" style={{ marginRight: '8px' }}></i> Órdenes Recientes</h3>
                {ordenesRecientes.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: '#aaa' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #262626' }}>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#ff6600' }}>ID Orden</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#ff6600' }}>Inicio</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#ff6600' }}>Estimado</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#ff6600' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesRecientes.map((orden) => (
                          <tr key={orden.ID_ORDEN_SERVICIO} style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ padding: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#ff6600', fontWeight: 600 }}>
  {formatId('orden', orden.ID_ORDEN_SERVICIO)}
</td>
                            <td style={{ padding: '10px' }}>{orden.ID_ORDEN_SERVICIO}</td>
                            <td style={{ padding: '10px' }}>{new Date(orden.Fecha_inicio).toLocaleDateString('es-ES')}</td>
                            <td style={{ padding: '10px' }}>{new Date(orden.Fecha_estimada).toLocaleDateString('es-ES')}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: getEstadoColor(orden.Estado), color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
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
        )}
      </div>

      {/* MODAL REGISTRAR MOTO */}
      {showMotoModal && (
        <div className="modal-overlay" onClick={() => setShowMotoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-motorcycle"></i> Registrar Motocicleta</h3>
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