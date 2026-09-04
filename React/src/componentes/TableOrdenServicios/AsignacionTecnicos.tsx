import { useEffect, useState, type ChangeEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerOrdenes,
  actualizarOrden,
  type OrdenServicioRecord,
} from '../../services/ordenServicioService';
import { obtenerClientes, type ClienteRecord } from '../../services/cliente.service';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnico.service';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import './AsignacionTecnicos.css';
import { extractArray } from '../../utils/apiHelpers';

// ── Helpers ──


// Normalizar estado para CSS class
const estadoClass = (estado: string) =>
  estado.toLowerCase().replace(/\s+/g, '-');

// ── Componente ──
const AsignacionTecnicos = () => {
  const [ordenes, setOrdenes] = useState<OrdenServicioRecord[]>([]);
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null); // ID de la orden que se está asignando
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'asignadas' | 'completadas'>('todas');
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>({}); // ordenId -> tecnicoId

  useEffect(() => {
    void cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ordenesRes, clientesRes, tecnicosRes] = await Promise.all([
        obtenerOrdenes(),
        obtenerClientes(),
        obtenerTecnicos(),
      ]);

      setOrdenes(extractArray<OrdenServicioRecord>(ordenesRes.data));
      setClientes(extractArray<ClienteRecord>(clientesRes.data));
      setTecnicos(extractArray<TecnicoRecord>(tecnicosRes.data));
    } catch (err) {
      console.error('Error cargando datos:', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos.',
        icon: 'error',
        background: '#0a0a0a',
        color: '#f5f5f5',
        confirmButtonColor: '#ff6600',
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolver nombres
  const getClienteNombre = (id: string) =>
    clientes.find(c => String(c.ID_CLIENTES) === String(id))?.Nombre || id;

  const getTecnicoNombre = (id?: string) => {
    if (!id) return null;
    return tecnicos.find(t => String(t.ID_TECNICOS) === String(id))?.Nombre || id;
  };

  // Ordenar técnicos alfabéticamente
  const tecnicosOrdenados = [...tecnicos]
    .filter(t => t.ID_TECNICOS)
    .sort((a, b) => (a.Nombre ?? '').localeCompare(b.Nombre ?? ''));

  // Clasificar órdenes
  const ordenesFiltered = ordenes.filter(o => {
    const term = search.toLowerCase();
    if (term) {
      const matchSearch =
        o.ID_ORDEN_SERVICIO.toLowerCase().includes(term) ||
        o.ID_CLIENTES.toLowerCase().includes(term) ||
        getClienteNombre(o.ID_CLIENTES).toLowerCase().includes(term) ||
        (o.ID_TECNICOS && getTecnicoNombre(o.ID_TECNICOS)?.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }
    return true;
  });

  const pendientes = ordenesFiltered.filter(o => !o.ID_TECNICOS || o.Estado?.toLowerCase() === 'pendiente');
  const enProceso = ordenesFiltered.filter(o => o.ID_TECNICOS && (o.Estado?.toLowerCase() === 'en proceso' || o.Estado?.toLowerCase() === 'en_proceso'));
  const completadas = ordenesFiltered.filter(o => {
    const st = o.Estado?.toLowerCase();
    return st === 'completado' || st === 'cancelado' || st === 'finalizado' || st === 'finalizada' || st === 'cancelada';
  });

  // Asignar técnico
  const handleAsignar = async (orden: OrdenServicioRecord) => {
    const tecId = selectedTech[orden.ID_ORDEN_SERVICIO];
    if (!tecId) return;

    const tecNombre = getTecnicoNombre(tecId) || tecId;

    const confirm = await Swal.fire({
      title: '¿Confirmar asignación?',
      html: `
        <div class="swal-ktm-body">
          <div class="swal-ktm-info-row">
            <div class="swal-ktm-info-card">
              <span class="swal-ktm-info-label">Orden</span>
              <span class="swal-ktm-info-value">${orden.ID_ORDEN_SERVICIO}</span>
            </div>
            <div class="swal-ktm-info-card">
              <span class="swal-ktm-info-label">Técnico</span>
              <span class="swal-ktm-info-value">${tecNombre}</span>
            </div>
          </div>
          <div style="margin-top: 15px; text-align: left; display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label for="fecha-estimada" style="display: block; color: #aaa; margin-bottom: 5px; font-size: 0.9rem;" htmlFor="auto-id-492788">Fecha Estimada</label>
<input type="date" id="fecha-estimada" class="swal2-input" style="width: 100%; max-width: 100%; background: #222; color: #fff; border: 1px solid #444; margin: 0; font-size: 0.9rem; padding: 0 10px;" />
            </div>
            <div style="flex: 1;">
              <label for="garantia-productos" style="display: block; color: #aaa; margin-bottom: 5px; font-size: 0.9rem;" htmlFor="auto-id-492789">Garantía Productos (Días)</label>
<input type="number" id="garantia-productos" class="swal2-input" placeholder="Ej. 30" min="0" style="width: 100%; max-width: 100%; background: #222; color: #fff; border: 1px solid #444; margin: 0; font-size: 0.9rem; padding: 0 10px;" />
            </div>
            <div style="flex: 1;">
              <label for="garantia-servicios" style="display: block; color: #aaa; margin-bottom: 5px; font-size: 0.9rem;" htmlFor="auto-id-492790">Garantía Servicios (Días)</label>
<input type="number" id="garantia-servicios" class="swal2-input" placeholder="Ej. 15" min="0" style="width: 100%; max-width: 100%; background: #222; color: #fff; border: 1px solid #444; margin: 0; font-size: 0.9rem; padding: 0 10px;" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-person-check"></i> Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0a0a0a',
      color: '#f5f5f5',
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#1e1e1e',
      customClass: {
        popup: 'swal-ktm-popup',
        title: 'swal-ktm-title',
        confirmButton: 'swal-ktm-confirm',
        cancelButton: 'swal-ktm-cancel',
      },
      preConfirm: () => {
        return {
          fecha: (document.getElementById('fecha-estimada') as HTMLInputElement)?.value,
          garantiaProductos: (document.getElementById('garantia-productos') as HTMLInputElement)?.value,
          garantiaServicios: (document.getElementById('garantia-servicios') as HTMLInputElement)?.value
        };
      }
    });

    if (!confirm.isConfirmed) return;
    const { fecha, garantiaProductos, garantiaServicios } = confirm.value;

    try {
      setSubmitting(orden.ID_ORDEN_SERVICIO);
      await actualizarOrden(orden.ID_ORDEN_SERVICIO, {
        ID_CLIENTES: orden.ID_CLIENTES,
        ID_ADMINISTRADOR: orden.ID_ADMINISTRADOR || '',
        ID_TECNICOS: tecId,
        ID_MOTOS: orden.ID_MOTOS,
        Fecha_estimada: fecha || orden.Fecha_estimada,
        garantia_productos: garantiaProductos ? Number(garantiaProductos) : undefined,
        garantia_servicios: garantiaServicios ? Number(garantiaServicios) : undefined,
        Estado: 'Pendiente',
        ClienteNombre: orden.ClienteNombre || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      Swal.fire({
        title: '¡Asignado!',
        text: `${tecNombre} fue asignado a la orden ${orden.ID_ORDEN_SERVICIO}`,
        icon: 'success',
        background: '#0a0a0a',
        color: '#f5f5f5',
        confirmButtonColor: '#ff6600',
        customClass: { popup: 'swal-ktm-popup', title: 'swal-ktm-title' },
        timer: 2000,
        showConfirmButton: false,
      });

      // Limpiar selección y recargar
      setSelectedTech(prev => {
        const copy = { ...prev };
        delete copy[orden.ID_ORDEN_SERVICIO];
        return copy;
      });
      await cargarDatos();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo asignar el técnico.',
        icon: 'error',
        background: '#0a0a0a',
        color: '#f5f5f5',
        confirmButtonColor: '#ff6600',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleTechChange = (ordenId: string, e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTech(prev => ({ ...prev, [ordenId]: e.target.value }));
  };

  const handleObservaciones = async (orden: OrdenServicioRecord) => {
    const { value: observaciones } = await Swal.fire({
      title: 'Observaciones / Garantía',
      input: 'textarea',
      inputLabel: 'Escribe las observaciones de entrega de esta orden:',
      inputValue: orden.observaciones || '',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      background: '#0a0a0a',
      color: '#f5f5f5',
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#1e1e1e',
      customClass: { popup: 'swal-ktm-popup', title: 'swal-ktm-title' },
      inputValidator: (val) => {
        if (!val) return 'Debes escribir algo...';
        return null;
      }
    });

    if (observaciones) {
      try {
        setSubmitting(orden.ID_ORDEN_SERVICIO);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await actualizarOrden(orden.ID_ORDEN_SERVICIO, { observaciones } as any);
        Swal.fire({
          title: 'Guardado',
          text: 'Las observaciones se guardaron con éxito',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0a0a0a',
          color: '#f5f5f5',
        });
        await cargarDatos();
      } catch (err) {
        Swal.fire('Error', 'No se pudieron guardar las observaciones', 'error');
      } finally {
        setSubmitting(null);
      }
    }
  };

  // Formatear fecha
  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  // ── Render card de orden ──
  const renderOrderCard = (orden: OrdenServicioRecord) => {
    const isAssigning = submitting === orden.ID_ORDEN_SERVICIO;
    const tecnicoNombre = getTecnicoNombre(orden.ID_TECNICOS);

    return (
      <div className="order-card" key={orden.ID_ORDEN_SERVICIO}>
        <div className="order-card-top">
          <span className="order-card-id">
            <FormattedId entity="orden" value={orden.ID_ORDEN_SERVICIO} />
          </span>
          <span className={`order-card-estado estado-${estadoClass(orden.Estado)}`}>
            {orden.Estado}
          </span>
        </div>

        <div className="order-card-details">
          <div className="order-detail-row">
            <i className="bi bi-person" />
            <span className="detail-label">Cliente</span>
            <span className="detail-value">{getClienteNombre(orden.ID_CLIENTES)}</span>
          </div>
          {orden.ID_MOTOS && (
            <div className="order-detail-row">
              <i className="bi bi-bicycle" />
              <span className="detail-label">Moto</span>
              <span className="detail-value">
                <FormattedId entity="moto" value={orden.ID_MOTOS} />
              </span>
            </div>
          )}
          <div className="order-detail-row">
            <i className="bi bi-calendar3" />
            <span className="detail-label">Inicio</span>
            <span className="detail-value">{formatFecha(orden.Fecha_inicio)}</span>
          </div>
          <div className="order-detail-row">
            <i className="bi bi-calendar-check" />
            <span className="detail-label">Estimada</span>
            <span className="detail-value">{formatFecha(orden.Fecha_estimada)}</span>
          </div>
        </div>

        <div className="order-tech-assign">
          {tecnicoNombre ? (
            <div className="tech-current">
              <i className="bi bi-person-check" />
              <span>Asignado a: <span className="tech-name">{tecnicoNombre}</span></span>
            </div>
          ) : (
            <div className="tech-badge-unassigned">
              <i className="bi bi-exclamation-triangle" /> Sin técnico asignado
            </div>
          )}

          {orden.Estado?.toLowerCase() === 'pendiente' && (
            <div className="tech-assign-row">
              <select
                className="tech-select"
                value={selectedTech[orden.ID_ORDEN_SERVICIO] ?? orden.ID_TECNICOS ?? ''}
                onChange={(e) => handleTechChange(orden.ID_ORDEN_SERVICIO, e)}
              >
                <option value="">-- Seleccionar técnico --</option>
                {tecnicosOrdenados.map(t => (
                  <option key={t.ID_TECNICOS} value={t.ID_TECNICOS}>
                    {t.Nombre}
                  </option>
                ))}
              </select>
              <button
                className="btn-assign"
                disabled={isAssigning || !selectedTech[orden.ID_ORDEN_SERVICIO]}
                onClick={() => handleAsignar(orden)}
              >
                {isAssigning ? (
                  <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> ...</>
                ) : (
                  <><i className="bi bi-check2" /> Asignar</>
                )}
              </button>
            </div>
          )}

          {(orden.Estado?.toLowerCase() === 'finalizado' || orden.Estado?.toLowerCase() === 'finalizada') && !orden.observaciones && (
            <div className="tech-assign-row" style={{ marginTop: '10px' }}>
              <button
                className="btn-assign"
                style={{ width: '100%', background: '#ff6600', color: '#fff' }}
                onClick={() => handleObservaciones(orden)}
              >
                <i className="bi bi-pencil-square" /> Agregar Observaciones
              </button>
            </div>
          )}
          {(orden.Estado?.toLowerCase() === 'finalizado' || orden.Estado?.toLowerCase() === 'finalizada') && orden.observaciones && (
            <div style={{ marginTop: '15px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', borderLeft: '4px solid #4ade80' }}>
              <span style={{ display: 'block', color: '#4ade80', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <i className="bi bi-check-circle-fill" style={{ marginRight: '6px' }}/> Observaciones
              </span>
              <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {orden.observaciones}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Decidir qué columnas mostrar
  const showPendientes = filtro === 'todas' || filtro === 'pendientes';
  const showAsignadas = filtro === 'todas' || filtro === 'asignadas';
  const showCompletadas = filtro === 'todas' || filtro === 'completadas';

  if (loading) {
    return (
      <div className="asignacion-loading">
        <div className="spinner" />
        Cargando órdenes de servicio...
      </div>
    );
  }

  return (
    <div className="asignacion-page">
      {/* Header */}
      <div className="asignacion-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <BackButton />
          <h1 style={{ margin: 0, borderBottom: 'none' }}>Asignación de Técnicos</h1>
        </div>
        <p>Gestiona y asigna técnicos a las órdenes de servicio del sistema</p>
      </div>

      {/* Stats */}
      <div className="asignacion-stats">
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="bi bi-clock-history" />
          </div>
          <div className="stat-info">
            <span className="stat-number">{pendientes.length}</span>
            <span className="stat-label">Pendientes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon assigned">
            <i className="bi bi-person-gear" />
          </div>
          <div className="stat-info">
            <span className="stat-number">{enProceso.length}</span>
            <span className="stat-label">En Proceso</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <i className="bi bi-check-circle" />
          </div>
          <div className="stat-info">
            <span className="stat-number">{completadas.length}</span>
            <span className="stat-label">Finalizadas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="bi bi-list-ol" />
          </div>
          <div className="stat-info">
            <span className="stat-number">{ordenes.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="asignacion-filters">
        <input
          className="filter-search"
          type="text"
          placeholder="Buscar por ID, cliente o técnico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(['todas', 'pendientes', 'asignadas', 'completadas'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div
        className="kanban-container"
        style={{
          gridTemplateColumns:
            [showPendientes, showAsignadas, showCompletadas].filter(Boolean).length === 1
              ? '1fr'
              : `repeat(${[showPendientes, showAsignadas, showCompletadas].filter(Boolean).length}, 1fr)`,
        }}
      >
        {showPendientes && (
          <div className="kanban-column column-pending">
            <div className="kanban-column-header">
              <h3><span className="dot pending" /> Pendientes</h3>
              <span className="count-badge">{pendientes.length}</span>
            </div>
            <div className="kanban-column-body">
              {pendientes.length === 0 ? (
                <div className="kanban-empty">No hay órdenes pendientes</div>
              ) : (
                pendientes.map(renderOrderCard)
              )}
            </div>
          </div>
        )}

        {showAsignadas && (
          <div className="kanban-column column-assigned">
            <div className="kanban-column-header">
              <h3><span className="dot assigned" /> En Proceso</h3>
              <span className="count-badge">{enProceso.length}</span>
            </div>
            <div className="kanban-column-body">
              {enProceso.length === 0 ? (
                <div className="kanban-empty">No hay órdenes en proceso</div>
              ) : (
                enProceso.map(renderOrderCard)
              )}
            </div>
          </div>
        )}

        {showCompletadas && (
          <div className="kanban-column column-completed">
            <div className="kanban-column-header">
              <h3><span className="dot completed" /> Finalizadas</h3>
              <span className="count-badge">{completadas.length}</span>
            </div>
            <div className="kanban-column-body">
              {completadas.length === 0 ? (
                <div className="kanban-empty">No hay órdenes finalizadas</div>
              ) : (
                completadas.map(renderOrderCard)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsignacionTecnicos;
