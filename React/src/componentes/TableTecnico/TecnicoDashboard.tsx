import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  obtenerMisOrdenes,
  actualizarOrden,
  obtenerDetallesPorOrden,
  type OrdenServicioRecord
} from '../../services/ordenServicioService';
import {
  obtenerClientes,
  type ClienteRecord
} from '../../services/cliente.service';
import { clearSession } from '../../services/auth.services';
import { formatId } from '../../utils/formatIds';
import { crearInforme, obtenerMisInformes, type InformeRecord } from '../../services/informe.service';
import { obtenerMotoPorId, type MotoRecord } from '../../services/moto.service';
import './TecnicoDashboard.css';

import { OrdenUI, ClienteUI, OrdenesAsignadas } from './OrdenesAsignadas';

// ==================== COMPONENTE PRINCIPAL ====================
const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const tecnicoNombre = localStorage.getItem('user_name') || 'Técnico';

  const tecnicoIdRaw = localStorage.getItem('user_id');
  const tecnicoId = tecnicoIdRaw ? parseInt(tecnicoIdRaw, 10) : null;

  const [activeTab, setActiveTab] = useState<'activas' | 'historial' | 'informes'>('activas');

  const [ordenes, setOrdenes] = useState<OrdenUI[]>([]);
  const [informes, setInformes] = useState<InformeRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal detalle orden
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenActual, setOrdenActual] = useState<OrdenUI | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ordenDetalles, setOrdenDetalles] = useState<any[]>([]);
  const [motoDetalle, setMotoDetalle] = useState<MotoRecord | null>(null);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Modal informe
  const [modalInformeAbierto, setModalInformeAbierto] = useState(false);
  const [informeForm, setInformeForm] = useState({
    diagnostico: '',
    trabajo_realizado: '',
    recomendaciones: '',
  });
  const [guardandoInforme, setGuardandoInforme] = useState(false);

  // ==================== HELPERS ====================
  const extraerDatos = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      const found = obj.data || obj.ordenes || obj.informes;
      if (Array.isArray(found)) return found as T[];
    }
    return [];
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getEstadoConfig = (estado: string) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('pendiente'))  return { class: 'estado-pendiente',  icon: 'bi-clock',        label: 'Pendiente',  next: 'En proceso' };
    if (e.includes('proceso'))    return { class: 'estado-proceso',    icon: 'bi-arrow-repeat', label: 'En Proceso', next: 'Finalizada' };
    if (e.includes('finalizada') || e.includes('completado')) return { class: 'estado-completado', icon: 'bi-check-circle', label: 'Finalizada', next: '' };
    if (e.includes('cancelada') || e.includes('cancelado'))  return { class: 'estado-cancelado',  icon: 'bi-x-circle',    label: 'Cancelada',  next: '' };
    return { class: 'estado-desconocido', icon: 'bi-question-circle', label: estado, next: '' };
  };

  // ==================== FETCH ====================
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resOrdenes, resClientes, resInformes] = await Promise.all([
        obtenerMisOrdenes(),
        obtenerClientes(),
        obtenerMisInformes(),
      ]);

      const todasOrdenes = extraerDatos<OrdenServicioRecord>(resOrdenes.data);
      const todosClientes = extraerDatos<ClienteUI>(resClientes.data);
      const todosInformes = extraerDatos<InformeRecord>(resInformes.data);

      const misOrdenes: OrdenUI[] = todasOrdenes
        .map(o => {
          const cliente = todosClientes.find(c => String(c.ID_CLIENTES) === String(o.ID_CLIENTES));
          return { ...o, ClienteNombre: cliente?.Nombre || 'Sin nombre' } as OrdenUI;
        });

      setOrdenes(misOrdenes);
      setInformes(todosInformes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); }, []);

  // ==================== ACCIONES ====================
  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const result = await Swal.fire({
      title: '¿Actualizar estado?',
      html: `Se marcará como: <strong>${nuevoEstado}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await actualizarOrden(id, {
        Estado: nuevoEstado,
        Fecha_fin: nuevoEstado === 'Completado' ? new Date().toISOString() : undefined
      });
      await cargarDatos();
      Swal.fire('✅ Actualizado', `Estado cambiado a "${nuevoEstado}".`, 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar', 'error');
    }
  };

  const abrirModalDetalle = async (orden: OrdenUI) => {
    setOrdenActual(orden);
    setModalAbierto(true);
    setCargandoDetalles(true);
    setOrdenDetalles([]);
    setMotoDetalle(null);
    try {
      const [resDetalles, resMoto] = await Promise.all([
        obtenerDetallesPorOrden(orden.ID_ORDEN_SERVICIO),
        orden.ID_MOTOS ? obtenerMotoPorId(orden.ID_MOTOS) : Promise.resolve(null)
      ]);
      
      if (resDetalles?.data?.data) {
        setOrdenDetalles(resDetalles.data.data);
      } else if (resDetalles?.data) {
        setOrdenDetalles(resDetalles.data);
      }

      if (resMoto?.data?.data) {
        setMotoDetalle(resMoto.data.data);
      } else if (resMoto?.data) {
        setMotoDetalle(resMoto.data);
      }
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const abrirModalInforme = (orden: OrdenUI) => {
    setOrdenActual(orden);
    setInformeForm({ diagnostico: '', trabajo_realizado: '', recomendaciones: '' });
    setModalInformeAbierto(true);
  };

  const guardarInforme = async () => {
    if (!ordenActual || !tecnicoId) return;
    if (!informeForm.diagnostico && !informeForm.trabajo_realizado) {
      Swal.fire('Atención', 'Escribe al menos el diagnóstico o el trabajo realizado.', 'warning');
      return;
    }
    setGuardandoInforme(true);
    try {
      await crearInforme({
        id_orden: Number(ordenActual.ID_ORDEN_SERVICIO),
        id_tecnico: tecnicoId,
        diagnostico: informeForm.diagnostico,
        trabajo_realizado: informeForm.trabajo_realizado,
        recomendaciones: informeForm.recomendaciones,
      });
      
      // Marcar orden como finalizada automáticamente
      await actualizarOrden(String(ordenActual.ID_ORDEN_SERVICIO), {
        Estado: 'Finalizada',
        Fecha_fin: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      setModalInformeAbierto(false);
      await cargarDatos();
      Swal.fire('✅ Informe guardado', 'El informe fue registrado y la orden marcada como Completada.', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      Swal.fire('❌ Error', err.response?.data?.message || 'No se pudo guardar.', 'error');
    } finally {
      setGuardandoInforme(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then(r => { if (r.isConfirmed) clearSession(); });
  };

  // Stats corregidos
  const esTerminada = (o: OrdenUI) => {
    const e = (o.Estado || '').toLowerCase();
    return e.includes('finalizada') || e.includes('completado') || e.includes('cancelada') || e.includes('cancelado');
  };
  const stats = {
    nuevasOrdenes:  ordenes.filter(o => o.Estado?.toLowerCase().includes('pendiente')).length,
    enProceso:      ordenes.filter(o => o.Estado?.toLowerCase().includes('proceso')).length,
    completadasHoy: ordenes.filter(o => {
      if (!esTerminada(o)) return false;
      if (!o.Fecha_fin) return false;
      const d = new Date(o.Fecha_fin);
      const now = new Date();
      // Considerarla de hoy si se finalizó en las últimas 24 horas
      return !isNaN(d.getTime()) && (now.getTime() - d.getTime()) < 86400000;
    }).length,
  };

  if (loading && !ordenes.length) return (
    <div className="dashboard-loader">
      <i className="bi bi-gear-wide-connected" style={{ fontSize: '2rem', color: '#ff6600', animation: 'spin 1s linear infinite' }}></i>
      <p>Cargando panel técnico...</p>
    </div>
  );

  return (
    <div className="tecnico-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1><i className="bi bi-wrench-adjustable"></i> Panel de {tecnicoNombre}</h1>
            <p>Gestión técnica de órdenes asignadas</p>
          </div>
            <div className="header-actions">
              <button className="logout-btn" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Salir
              </button>
            </div>
        </div>
      </header>

      {/* STATS */}
      <div className="tech-stats-bar">
        <div className="tech-stat stat-blue">
          <div className="stat-icon"><i className="bi bi-bell-fill"></i></div>
          <span className="tech-stat-val">{stats.nuevasOrdenes}</span>
          <span className="tech-stat-label">Nuevas Órdenes</span>
        </div>
        <div className="tech-stat stat-purple">
          <div className="stat-icon"><i className="bi bi-arrow-repeat"></i></div>
          <span className="tech-stat-val">{stats.enProceso}</span>
          <span className="tech-stat-label">En Proceso</span>
        </div>
        <div className="tech-stat stat-cyan">
          <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
          <span className="tech-stat-val">{stats.completadasHoy}</span>
          <span className="tech-stat-label">Completadas Hoy</span>
        </div>
      </div>

      {/* TABS — sin "Clientes" */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'activas' ? 'active' : ''}`}
          onClick={() => setActiveTab('activas')}
        >
          <i className="bi bi-lightning-charge-fill"></i><span>Ver Órdenes</span>
        </button>
        <button
          className="tab-button tab-informes"
          onClick={() => navigate('/tecnico/informes')}
        >
          <i className="bi bi-file-earmark-text-fill"></i><span>Mis Informes</span>
        </button>
      </div>

      <main className="dashboard-main">
        {error && <div className="error-banner"><i className="bi bi-exclamation-triangle-fill"></i> {error}</div>}

        {/* ===== TAB: VER ÓRDENES ===== */}
        {activeTab === 'activas' && (
          <OrdenesAsignadas
            ordenes={ordenes}
            onActualizarEstado={actualizarEstado}
            onAbrirInforme={abrirModalInforme}
            onVerDetalle={abrirModalDetalle}
            getEstadoConfig={getEstadoConfig}
            formatDate={formatDate}
            formatId={formatId}
          />
        )}

        {/* ===== TAB: HISTORIAL ===== */}
        {activeTab === 'historial' && (
          <section className="tab-content">
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="ordenes-table">
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>Cliente</th>
                    <th>Fecha Fin</th>
                    <th>Estado</th>
                    <th>Informe</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.filter(o => esTerminada(o)).length === 0 ? (
                    <tr><td colSpan={6} className="empty-row">Sin órdenes finalizadas aún.</td></tr>
                  ) : (
                    ordenes.filter(o => esTerminada(o)).map(orden => (
                      <tr key={orden.ID_ORDEN_SERVICIO}>
                        <td className="orden-id">{formatId('orden', orden.ID_ORDEN_SERVICIO)}</td>
                        <td>{orden.ClienteNombre}</td>
                        <td>{formatDate(orden.Fecha_fin)}</td>
                        <td>
                          <span className={`estado-badge ${getEstadoConfig(orden.Estado).class}`}>
                            {orden.Estado}
                          </span>
                        </td>
                        <td>
                          {informes.some(inf => String(inf.id_orden) === String(orden.ID_ORDEN_SERVICIO)) && (
                            <button className="btn-detalles" onClick={() => abrirModalDetalle(orden)} title="Ver Informe">
                              <i className="bi bi-file-earmark-text"></i>
                            </button>
                          )}
                        </td>
                        <td>
                          <button className="btn-detalles" onClick={() => abrirModalDetalle(orden)}>
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ===== TAB: MIS INFORMES ===== */}
        {activeTab === 'informes' && (
          <section className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ff6600', margin: 0 }}>
                <i className="bi bi-file-earmark-text-fill"></i> Mis Informes Registrados
              </h3>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Total: {informes.length}</span>
            </div>
            {informes.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-file-earmark-x" style={{ fontSize: '3rem', color: '#333' }}></i>
                <p style={{ color: '#555', marginTop: '1rem' }}>No has registrado informes aún.</p>
                <p style={{ fontSize: '0.85rem', color: '#444' }}>
                  Abre una orden <strong>"En Proceso"</strong> y pulsa <strong>"Redactar Informe"</strong>.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {informes.map(inf => (
                  <div key={inf.id_informe} style={{
                    background: 'linear-gradient(135deg,#141414,#0a0a0a)',
                    border: '1px solid #262626',
                    borderLeft: '4px solid #ff6600',
                    borderRadius: '10px',
                    padding: '1.2rem 1.5rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <span style={{ color: '#ff6600', fontWeight: 700 }}>
                        <i className="bi bi-file-earmark-text"></i> Informe #{inf.id_informe}
                      </span>
                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                        Orden: {formatId('orden', inf.id_orden)} &nbsp;|&nbsp;
                        {inf.fecha ? new Date(inf.fecha).toLocaleString('es-CO') : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 0.3rem', textTransform: 'uppercase' }}>Diagnóstico</p>
                        <p style={{ color: '#f5f5f5', margin: 0 }}>{inf.diagnostico || '—'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 0.3rem', textTransform: 'uppercase' }}>Trabajo Realizado</p>
                        <p style={{ color: '#f5f5f5', margin: 0 }}>{inf.trabajo_realizado || '—'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 0.3rem', textTransform: 'uppercase' }}>Recomendaciones</p>
                        <p style={{ color: '#f5f5f5', margin: 0 }}>{inf.recomendaciones || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ===== MODAL: DETALLE ORDEN ===== */}
      {modalAbierto && ordenActual && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content modal-tecnico" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-tools"></i> Detalle — {formatId('orden', ordenActual.ID_ORDEN_SERVICIO)}</h3>
              <button className="modal-close" onClick={() => setModalAbierto(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div><strong>Cliente:</strong> {ordenActual.ClienteNombre}</div>
                <div><strong>Ingreso:</strong> {formatDate(ordenActual.Fecha_inicio)}</div>
                <div><strong>Estimada:</strong> {formatDate(ordenActual.Fecha_estimada)}</div>
                <div><strong>Estado:</strong> <span className={`estado-badge ${getEstadoConfig(ordenActual.Estado).class}`}>{ordenActual.Estado}</span></div>
                <div><strong>Total:</strong> ${Number(ordenActual.total || 0).toLocaleString('es-CO')}</div>
              </div>

              {motoDetalle && (
                <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid #333', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ color: '#40c057', margin: '0 0 0.8rem', fontSize: '0.95rem' }}><i className="bi bi-bicycle"></i> Datos de la Moto</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div><strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Placa</strong> {motoDetalle.Placa || motoDetalle.placa || '—'}</div>
                    <div><strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Marca</strong> {motoDetalle.Marca || motoDetalle.marca || '—'}</div>
                    <div><strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Modelo</strong> {motoDetalle.Modelo || motoDetalle.modelo || '—'}</div>
                    <div><strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cilindraje</strong> {motoDetalle.Cilindraje || motoDetalle.cilindraje || '—'}</div>
                    <div><strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Kilometraje</strong> {motoDetalle.Kilometraje || motoDetalle.kilometraje || '—'}</div>
                  </div>
                </div>
              )}
              {ordenActual.observaciones && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#141414', borderRadius: '8px', borderLeft: '3px solid #555' }}>
                  <strong style={{ color: '#aaa' }}>Observaciones:</strong>
                  <p style={{ color: '#f5f5f5', margin: '0.3rem 0 0' }}>{ordenActual.observaciones}</p>
                </div>
              )}
              
              <div style={{ marginTop: '1.5rem', background: '#0d0d0d', border: '1px solid #222', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: '#ff6600', margin: '0 0 1rem', fontSize: '1rem' }}><i className="bi bi-list-check"></i> Servicios y Productos</h4>
                {cargandoDetalles ? (
                  <p style={{ color: '#aaa', textAlign: 'center' }}><i className="bi bi-hourglass-split"></i> Cargando detalles...</p>
                ) : ordenDetalles.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>No hay servicios ni productos asignados.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Ítem</th>
                          <th style={{ textAlign: 'center', padding: '0.5rem' }}>Cant.</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem' }}>Precio</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenDetalles.map(det => (
                          <tr key={det.ID_DETALLES_ORDEN_SERVICIO} style={{ borderBottom: '1px solid #1a1a1a', color: '#f5f5f5' }}>
                            <td style={{ padding: '0.5rem' }}>
                              {det.NombreServicio && <div style={{ color: '#4c6ef5' }}><i className="bi bi-wrench"></i> {det.NombreServicio}</div>}
                              {det.NombreProducto && <div style={{ color: '#40c057' }}><i className="bi bi-box-seam"></i> {det.NombreProducto}</div>}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.5rem' }}>{det.cantidad}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem' }}>${Number(det.Precio).toLocaleString('es-CO')}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>${Number(det.subtotal).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {(() => {
                const informeAsociado = informes.find(inf => String(inf.id_orden) === String(ordenActual.ID_ORDEN_SERVICIO));
                if (!informeAsociado) return null;
                return (
                  <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,#1a1005,#140d05)', border: '1px solid #331f0a', borderLeft: '4px solid #ff6600', borderRadius: '8px', padding: '1rem' }}>
                    <h4 style={{ color: '#ff6600', margin: '0 0 1rem', fontSize: '1rem' }}><i className="bi bi-file-earmark-text"></i> Informe Técnico Realizado</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                      <div>
                        <strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Diagnóstico</strong>
                        <p style={{ color: '#f5f5f5', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{informeAsociado.diagnostico || '—'}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trabajo Realizado</strong>
                        <p style={{ color: '#f5f5f5', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{informeAsociado.trabajo_realizado || '—'}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#aaa', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Recomendaciones</strong>
                        <p style={{ color: '#f5f5f5', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{informeAsociado.recomendaciones || '—'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {getEstadoConfig(ordenActual.Estado).label === 'En Proceso' && (
                <button
                  className="btn-guardar"
                  style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,#00b4d8,#0077b6)' }}
                  onClick={() => { setModalAbierto(false); abrirModalInforme(ordenActual); }}
                >
                  <i className="bi bi-file-earmark-plus"></i> Redactar Informe
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: CREAR INFORME ===== */}
      {modalInformeAbierto && ordenActual && (
        <div className="modal-overlay" onClick={() => setModalInformeAbierto(false)}>
          <div className="modal-content modal-tecnico" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3><i className="bi bi-file-earmark-plus"></i> Informe — {formatId('orden', ordenActual.ID_ORDEN_SERVICIO)}</h3>
              <button className="modal-close" onClick={() => setModalInformeAbierto(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#141414', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.5rem', borderLeft: '3px solid #ff6600' }}>
                <strong style={{ color: '#aaa', fontSize: '0.85rem' }}>ORDEN</strong>
                <p style={{ color: '#f5f5f5', margin: '0.2rem 0 0' }}>
                  {formatId('orden', ordenActual.ID_ORDEN_SERVICIO)} — Cliente: {ordenActual.ClienteNombre}
                </p>
              </div>

              <div className="detalle-form">
                {[
                  { key: 'diagnostico', label: 'Diagnóstico', icon: 'bi-search', placeholder: 'Describe el problema encontrado en la moto...' },
                  { key: 'trabajo_realizado', label: 'Trabajo Realizado', icon: 'bi-tools', placeholder: 'Detalla el trabajo realizado, piezas cambiadas, ajustes...' },
                  { key: 'recomendaciones', label: 'Recomendaciones', icon: 'bi-chat-square-text', placeholder: 'Indica próximo mantenimiento, cuidados, etc...' },
                ].map(({ key, label, icon, placeholder }) => (
                  <div className="form-group" key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#aaa', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      <i className={`bi ${icon}`}></i> {label}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={placeholder}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      value={(informeForm as any)[key]}
                      onChange={e => setInformeForm({ ...informeForm, [key]: e.target.value })}
                      style={{
                        width: '100%', background: '#0d0d0d', border: '1px solid #333',
                        borderRadius: '8px', color: '#f5f5f5', padding: '0.8rem',
                        resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn-guardar" onClick={guardarInforme} disabled={guardandoInforme} style={{ flex: 1 }}>
                    {guardandoInforme
                      ? <><i className="bi bi-hourglass-split"></i> Guardando...</>
                      : <><i className="bi bi-check-circle-fill"></i> Guardar Informe</>
                    }
                  </button>
                  <button
                    onClick={() => setModalInformeAbierto(false)}
                    style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid #444', borderRadius: '8px', color: '#aaa', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TecnicoDashboard;