import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  obtenerOrdenes, 
  actualizarOrden, 
  type OrdenServicioRecord 
} from '../../services/ordenServicioService';
import { 
  obtenerClientes, 
  type ClienteRecord 
} from '../../services/cliente.service';
import { 
  obtenerDetallesOrdenes, 
  crearDetalleOrden, 
  type DetalleOrdenServicioPayload 
} from '../../services/detalleOrdenServicioService';
import { clearSession } from '../../services/auth.services';
import { formatId } from '../../utils/formatIds';
import './TecnicoDashboard.css';

// ==================== TIPOS UI ====================
interface OrdenUI extends OrdenServicioRecord {
  ClienteNombre: string;
}

interface ClienteUI extends ClienteRecord {
  ID_CLIENTES: string | number;
  Nombre: string;
  Telefono: string;
  Correo: string;
  Ubicacion: string;
}

interface DetalleUI extends DetalleOrdenServicioPayload {
  ID_DETALLES_ORDEN_SERVICIO?: string | number;
  NombreConcepto?: string;
  PrecioUnitario?: number;
}

// ==================== COMPONENTE ====================
const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const tecnicoId = localStorage.getItem('user_id') || localStorage.getItem('user_name');
  const tecnicoNombre = localStorage.getItem('user_name') || 'Técnico';

  const [activeTab, setActiveTab] = useState<'activas' | 'historial' | 'clientes'>('activas');
  
  const [ordenes, setOrdenes] = useState<OrdenUI[]>([]);
  const [clientes, setClientes] = useState<ClienteUI[]>([]);
  const [detallesOrden, setDetallesOrden] = useState<DetalleUI[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenActual, setOrdenActual] = useState<OrdenUI | null>(null);
  const [detalleForm, setDetalleForm] = useState<DetalleOrdenServicioPayload>({
    ID_ORDEN_SERVICIO: '',
    ID_SERVICIOS: '',
    ID_PRODUCTOS: '',
    Garantia: 0,
    Estado: 'Pendiente',
    Precio: 0
  });

  // ==================== FETCH ====================
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resOrdenes, resClientes] = await Promise.all([
        obtenerOrdenes(),
        obtenerClientes()
      ]);
      const todasOrdenes = extraerDatos<OrdenServicioRecord>(resOrdenes.data) || [];
      const todosClientes = extraerDatos<ClienteUI>(resClientes.data) || [];
      
      // Enriquecer órdenes con nombre del cliente
      const misOrdenes: OrdenUI[] = todasOrdenes
        .filter(o => String(o.ID_TECNICOS) === String(tecnicoId))
        .map(o => {
          const cliente = todosClientes.find(c => String(c.ID_CLIENTES) === String(o.ID_CLIENTES));
          return {
            ...o,
            ClienteNombre: cliente?.Nombre || ''
          } as OrdenUI;
        });
      
      setOrdenes(misOrdenes);
      setClientes(todosClientes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
      Swal.fire('Error', 'No se pudieron cargar las órdenes asignadas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // ==================== HELPERS ====================
  const extraerDatos = <T,>(payload: unknown): T[] | null => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      return (obj.data || obj.ordenes || obj.clientes || obj.detalles || null) as T[] | null;
    }
    return null;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getEstadoConfig = (estado: string) => {
    const e = estado.toLowerCase();
    if (e.includes('pendiente')) return { class: 'estado-pendiente', icon: 'bi-clock', label: 'Pendiente', next: 'En Proceso' };
    if (e.includes('proceso')) return { class: 'estado-proceso', icon: 'bi-arrow-repeat', label: 'En Proceso', next: 'Completado' };
    if (e.includes('completado') || e.includes('terminado')) return { class: 'estado-completado', icon: 'bi-check-circle', label: 'Completado', next: '' };
    if (e.includes('cancelado')) return { class: 'estado-cancelado', icon: 'bi-x-circle', label: 'Cancelado', next: '' };
    return { class: 'estado-desconocido', icon: 'bi-question-circle', label: estado, next: '' };
  };

  // ==================== ACCIONES TÉCNICAS ====================
  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const result = await Swal.fire({
      title: '¿Actualizar estado?',
      html: `Se marcará como: <strong>${nuevoEstado}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, actualizar',
    });
    if (!result.isConfirmed) return;

    try {
      await actualizarOrden(id, { Estado: nuevoEstado, Fecha_fin: nuevoEstado === 'Completado' ? new Date().toISOString() : undefined });
      await cargarDatos();
      Swal.fire('Actualizado', 'Estado registrado correctamente.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar', 'error');
    }
  };

  const abrirOrden = async (orden: OrdenUI) => {
    setOrdenActual(orden);
    setModalAbierto(true);
    setDetalleForm({ 
      ...detalleForm, 
      ID_ORDEN_SERVICIO: String(orden.ID_ORDEN_SERVICIO),
      ID_SERVICIOS: '',
      ID_PRODUCTOS: '',
      Garantia: 0,
      Precio: 0 
    });
    
    try {
      const res = await obtenerDetallesOrdenes();
      const todosDetalles = extraerDatos<DetalleUI>(res.data) || [];
      const detallesOrden = todosDetalles.filter(d => String(d.ID_ORDEN_SERVICIO) === String(orden.ID_ORDEN_SERVICIO));
      setDetallesOrden(detallesOrden);
    } catch {
      setDetallesOrden([]);
    }
  };

  const agregarDetalle = async () => {
    if (!detalleForm.ID_SERVICIOS && !detalleForm.ID_PRODUCTOS) {
      Swal.fire('Atención', 'Selecciona un servicio o producto.', 'warning');
      return;
    }

    try {
      // 🔢 Conversión segura a INT para compatibilidad con la BD migrada
      const payload = {
        ID_ORDEN_SERVICIO: parseInt(String(detalleForm.ID_ORDEN_SERVICIO), 10),
        ID_SERVICIOS: detalleForm.ID_SERVICIOS ? parseInt(String(detalleForm.ID_SERVICIOS), 10) : null,
        ID_PRODUCTOS: detalleForm.ID_PRODUCTOS ? parseInt(String(detalleForm.ID_PRODUCTOS), 10) : null,
        Garantia: Number(detalleForm.Garantia) || 0,
        Estado: 'Pendiente',
        Precio: Number(detalleForm.Precio) || 0
      };

      await crearDetalleOrden(payload as any);
      Swal.fire('✅ Agregado', 'Detalle registrado en la orden.', 'success');
      await abrirOrden(ordenActual!);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      Swal.fire('❌ Error', msg, 'error');
      console.error('Error al crear detalle:', err);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Serás redirigido al login.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, salir',
    }).then((r) => { if (r.isConfirmed) clearSession(); });
  };

  const stats = {
    activas: ordenes.filter(o => o.Estado.toLowerCase().includes('proceso')).length,
    pendientes: ordenes.filter(o => o.Estado.toLowerCase().includes('pendiente')).length,
    completadasHoy: ordenes.filter(o => {
      if (!o.Fecha_fin) return false;
      return new Date(o.Fecha_fin).toDateString() === new Date().toDateString();
    }).length
  };

  // ==================== RENDER ====================
  if (loading && !ordenes.length) return <div className="dashboard-loader">Cargando panel técnico...</div>;

  return (
    <div className="tecnico-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1><i className="bi bi-wrench"></i> Panel de {tecnicoNombre}</h1>
            <p>Gestión técnica de órdenes asignadas</p>
          </div>
          <div className="header-actions">
            <button className="nav-btn" onClick={() => navigate('/tecnico/menu')} title="Menú principal">
              <i className="bi bi-grid"></i> Menú
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="tech-stats-bar">
        <div className="tech-stat"><span className="tech-stat-val">{stats.activas}</span><span className="tech-stat-label">En Proceso</span></div>
        <div className="tech-stat"><span className="tech-stat-val">{stats.pendientes}</span><span className="tech-stat-label">Pendientes</span></div>
        <div className="tech-stat"><span className="tech-stat-val">{stats.completadasHoy}</span><span className="tech-stat-label">Completadas Hoy</span></div>
      </div>

      <div className="tabs-container">
        {['activas', 'historial', 'clientes'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)}>
            <i className={`bi ${tab === 'activas' ? 'bi-lightning' : tab === 'historial' ? 'bi-clock-history' : 'bi-people'}`}></i>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <main className="dashboard-main">
        {error && <div className="error-banner">{error}</div>}

        {activeTab === 'activas' && (
          <section className="tab-content">
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="ordenes-table">
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>ID Cliente</th>
                    <th>Cliente</th>
                    <th>Moto</th>
                    <th>Inicio</th>
                    <th>Estado</th>
                    <th>Acciones Técnicas</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.filter(o => 
                    !o.Estado.toLowerCase().includes('completado') && 
                    !o.Estado.toLowerCase().includes('cancelado') && 
                    o.ClienteNombre && o.ClienteNombre.trim() !== ''
                  ).length === 0 ? (
                    <tr><td colSpan={7} className="empty-row">No tienes órdenes activas. ¡Descansa!</td></tr>
                  ) : (
                    ordenes.filter(o => 
                      !o.Estado.toLowerCase().includes('completado') && 
                      !o.Estado.toLowerCase().includes('cancelado') && 
                      o.ClienteNombre && o.ClienteNombre.trim() !== ''
                    ).map(orden => {
                      const cfg = getEstadoConfig(orden.Estado);
                      return (
                        <tr key={orden.ID_ORDEN_SERVICIO}>
                          <td className="orden-id" onClick={() => abrirOrden(orden)} style={{ cursor: 'pointer', color: '#ff6600' }}>
                            {formatId('orden', orden.ID_ORDEN_SERVICIO)}
                          </td>
                          <td className="font-mono text-blue-400 font-semibold tracking-wide">
                            {formatId('cliente', orden.ID_CLIENTES)}
                          </td>
                          <td>{orden.ClienteNombre}</td>
                          <td>{orden.ID_MOTOS ? formatId('moto', orden.ID_MOTOS) : 'Sin moto'}</td>
                          <td>{formatDate(orden.Fecha_inicio)}</td>
                          <td><span className={`estado-badge ${cfg.class}`}><i className={`bi ${cfg.icon}`}></i> {cfg.label}</span></td>
                          <td className="acciones-cell">
                            {cfg.next && (
                              <button className="btn-flujo" onClick={() => actualizarEstado(orden.ID_ORDEN_SERVICIO, cfg.next)}>
                                <i className="bi bi-arrow-right-circle"></i> {cfg.next === 'En Proceso' ? 'Iniciar' : cfg.next === 'Completado' ? 'Completar' : cfg.next}
                              </button>
                            )}
                            {cfg.label === 'Pendiente' && (
                              <button className="btn-flujo btn-cancelar" onClick={() => actualizarEstado(orden.ID_ORDEN_SERVICIO, 'Cancelado')}>
                                <i className="bi bi-x-circle"></i> Cancelar
                              </button>
                            )}
                            <button className="btn-detalles" onClick={() => abrirOrden(orden)} title="Gestionar orden"><i className="bi bi-gear"></i></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'historial' && (
          <section className="tab-content">
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="ordenes-table">
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>ID Cliente</th>
                    <th>Cliente</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.filter(o => 
                    (o.Estado.toLowerCase().includes('completado') || o.Estado.toLowerCase().includes('cancelado')) && 
                    o.ClienteNombre && o.ClienteNombre.trim() !== ''
                  ).map(orden => (
                    <tr key={orden.ID_ORDEN_SERVICIO}>
                      <td className="orden-id">{formatId('orden', orden.ID_ORDEN_SERVICIO)}</td>
                      <td className="font-mono text-blue-400 font-semibold">{formatId('cliente', orden.ID_CLIENTES)}</td>
                      <td>{orden.ClienteNombre}</td>
                      <td>{formatDate(orden.Fecha_fin)}</td>
                      <td><span className={`estado-badge ${getEstadoConfig(orden.Estado).class}`}>{orden.Estado}</span></td>
                      <td><button className="btn-detalles" onClick={() => abrirOrden(orden)}><i className="bi bi-eye"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'clientes' && (
          <section className="tab-content">
            <p className="info-text">Consulta de referencia de clientes. Para registros/contactos: <strong>Administración</strong>.</p>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="clientes-table">
                <thead><tr><th>ID Cliente</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Ubicación</th></tr></thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.ID_CLIENTES}>
                      <td className="font-mono text-blue-400 font-semibold">{formatId('cliente', c.ID_CLIENTES)}</td>
                      <td><strong>{c.Nombre}</strong></td>
                      <td>{c.Telefono}</td>
                      <td>{c.Correo}</td>
                      <td>{c.Ubicacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {modalAbierto && ordenActual && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content modal-tecnico" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-tools"></i> Orden {formatId('orden', ordenActual.ID_ORDEN_SERVICIO)}</h3>
              <button className="modal-close" onClick={() => setModalAbierto(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div><strong>ID Cliente:</strong> <span className="font-mono text-blue-400">{formatId('cliente', ordenActual.ID_CLIENTES)}</span></div>
                <div><strong>Cliente:</strong> {ordenActual.ClienteNombre}</div>
                <div><strong>Moto:</strong> {ordenActual.ID_MOTOS ? formatId('moto', ordenActual.ID_MOTOS) : 'Sin asignar'}</div>
                <div><strong>Inicio:</strong> {formatDate(ordenActual.Fecha_inicio)}</div>
                <div><strong>Estado:</strong> <span className={`estado-badge ${getEstadoConfig(ordenActual.Estado).class}`}>{ordenActual.Estado}</span></div>
              </div>

              <h4 style={{ marginTop: '1.5rem', color: '#ff6600' }}>➕ Registrar Trabajo</h4>
              <div className="detalle-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Servicio/Producto</label>
                    <select 
                      value={detalleForm.ID_SERVICIOS} 
                      onChange={e => {
                        const val = e.target.value;
                        const precios: Record<string, number> = { '1': 50000, '2': 35000, '3': 80000 };
                        setDetalleForm({
                          ...detalleForm,
                          ID_SERVICIOS: val,
                          ID_PRODUCTOS: '',
                          Precio: precios[val] || 0
                        });
                      }}
                    >
                      <option value="">Seleccionar servicio...</option>
                      <option value="1">Cambio Aceite ($50.000)</option>
                      <option value="2">Revisión Frenos ($35.000)</option>
                      <option value="3">Ajuste Suspensión ($80.000)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Garantía (meses)</label>
                    <input type="number" value={detalleForm.Garantia} onChange={e => setDetalleForm({...detalleForm, Garantia: Number(e.target.value)})} />
                  </div>
                </div>
                <button className="btn-guardar" onClick={agregarDetalle}>Agregar Detalle</button>
              </div>

              <h4 style={{ marginTop: '1rem', color: '#aaa' }}>📋 Registro de Trabajo</h4>
              <table className="detalles-table">
                <thead><tr><th>Concepto</th><th>Garantía</th><th>Estado</th></tr></thead>
                <tbody>
                  {detallesOrden.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: '#777' }}>Sin detalles registrados</td></tr>
                  ) : (
                    detallesOrden.map((d, i) => (
                      <tr key={i}>
                        <td>
                          {d.ID_SERVICIOS ? `Servicio ${formatId('servicio', d.ID_SERVICIOS)}` : 
                           d.ID_PRODUCTOS ? `Producto ${formatId('producto', d.ID_PRODUCTOS)}` : 
                           'Concepto'}
                        </td>
                        <td>{d.Garantia} meses</td>
                        <td>{d.Estado}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TecnicoDashboard;