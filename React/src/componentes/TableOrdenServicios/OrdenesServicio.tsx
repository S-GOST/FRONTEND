import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerOrdenes,
  insertarOrden,
  actualizarOrden,
  eliminarOrden,
  type OrdenServicioRecord,
  type OrdenServicioPayload,
} from '../../services/ordenServicioService';
import { obtenerClientes, type ClienteRecord } from '../../services/cliente.service';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnico.service';
import { obtenerMotos, type MotoRecord } from '../../services/moto.service';
import { obtenerAdmins } from '../../services/admin.service';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import './OrdenesServicio.css';

// Extractor de datos para órdenes
const extractOrdenes = (payload: unknown): OrdenServicioRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    const fromData = extractOrdenes(nested.data);
    if (fromData.length) return fromData;
    const fromOrdenes = extractOrdenes(nested.ordenes);
    if (fromOrdenes.length) return fromOrdenes;
  }
  return [];
};

// Extractor genérico para cualquier entidad
const extractArray = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as T[];
    if (Array.isArray(nested.items)) return nested.items as T[];
    for (const key in nested) {
      if (Array.isArray(nested[key])) return nested[key] as T[];
    }
  }
  return [];
};

// Estado inicial del formulario
const initialFormState: OrdenServicioPayload = {
  ID_CLIENTES: '',
  ID_ADMINISTRADOR: '',
  ID_TECNICOS: '',
  ID_MOTOS: '',
  Fecha_inicio: '',
  Fecha_estimada: '',
  Fecha_fin: '',
  Estado: 'Pendiente',
  ClienteNombre: '',
};

const OrdenesServicio = () => {
  const [ordenes, setOrdenes] = useState<OrdenServicioRecord[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenServicioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrdenServicioRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<OrdenServicioPayload>(initialFormState);

  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);
  const [motos, setMotos] = useState<MotoRecord[]>([]);


  useEffect(() => {
    void cargarDatosIniciales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning') => {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: '#ff6600',
      background: '#101010',
      color: '#f5f5f5',
    });
  };

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [ordenesRes, clientesRes, tecnicosRes, motosRes] = await Promise.all([
        obtenerOrdenes(),
        obtenerClientes(),
        obtenerTecnicos(),
        obtenerMotos(),
        obtenerAdmins(),
      ]);

      const ordenesData = extractOrdenes(ordenesRes.data);
      setOrdenes(ordenesData);
      setFilteredOrdenes(ordenesData);

      setClientes(extractArray<ClienteRecord>(clientesRes.data));
      setTecnicos(extractArray<TecnicoRecord>(tecnicosRes.data));
      setMotos(extractArray<MotoRecord>(motosRes.data));

      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos necesarios.');
      showAlert('Error', 'No se pudieron cargar los datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    let filtered = ordenes;
    if (filtroEstado !== 'todas') {
      filtered = filtered.filter(orden => orden.Estado === filtroEstado);
    }
    if (term) {
      filtered = filtered.filter(orden =>
        orden.ID_ORDEN_SERVICIO.toLowerCase().includes(term) ||
        orden.ID_CLIENTES.toLowerCase().includes(term) ||
        (orden.ID_TECNICOS && orden.ID_TECNICOS.toLowerCase().includes(term)) ||
        (orden.ID_MOTOS && orden.ID_MOTOS.toLowerCase().includes(term))
      );
    }
    setFilteredOrdenes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFiltroEstado('todas');
    setFilteredOrdenes(ordenes);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setFormData(initialFormState);
    setModalFormOpen(true);
  };



  // --- NUEVA FUNCIÓN: Asignación rápida de técnico ---
  const asignarTecnicoRápido = async (orden: OrdenServicioRecord) => {
    // Crear las opciones para el select de SweetAlert (ID: Nombre)
    const opciones: Record<string, string> = {};

    // Opción para desasignar si se desea
    opciones[""] = "-- Desasignar / Sin Técnico --";

    // Ordenar técnicos alfabéticamente por nombre
    [...tecnicos]
      .sort((a, b) => (a.Nombre ?? '').localeCompare(b.Nombre ?? ''))
      .forEach(t => {
        if (t.ID_TECNICOS) {
          opciones[t.ID_TECNICOS] = `${t.Nombre} (${t.ID_TECNICOS})`;
        }
      });

    // Si no hay tecnicos cargados, avisar
    if (tecnicos.length === 0) {
      showAlert('Sin técnicos', 'No hay técnicos registrados en el sistema.', 'warning');
      return;
    }

    // Buscar nombre del cliente para mostrarlo
    const clienteNombre = clientes.find(c => String(c.ID_CLIENTES) === String(orden.ID_CLIENTES))?.Nombre || orden.ID_CLIENTES;
    const tecnicoActual = orden.ID_TECNICOS
      ? (tecnicos.find(t => String(t.ID_TECNICOS) === String(orden.ID_TECNICOS))?.Nombre || orden.ID_TECNICOS)
      : 'Sin asignar';

    const result = await Swal.fire({
      title: 'Asignar Técnico',
      html: `
        <div class="swal-ktm-body">
          <div class="swal-ktm-info-row">
            <div class="swal-ktm-info-card">
              <span class="swal-ktm-info-label">Orden</span>
              <span class="swal-ktm-info-value">${orden.ID_ORDEN_SERVICIO}</span>
            </div>
            <div class="swal-ktm-info-card">
              <span class="swal-ktm-info-label">Cliente</span>
              <span class="swal-ktm-info-value">${clienteNombre}</span>
            </div>
          </div>
          <div class="swal-ktm-current">
            <i class="bi bi-person-gear"></i>
            <span>Técnico actual: <strong>${tecnicoActual}</strong></span>
          </div>
          <p class="swal-ktm-prompt">Selecciona el nuevo técnico a cargo:</p>
        </div>
      `,
      input: 'select',
      inputOptions: opciones,
      inputValue: orden.ID_TECNICOS ?? '',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-person-check"></i> Asignar Técnico',
      cancelButtonText: 'Cancelar',
      inputPlaceholder: 'Selecciona un técnico',
      background: '#0a0a0a',
      color: '#f5f5f5',
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#1e1e1e',
      customClass: {
        popup: 'swal-ktm-popup',
        title: 'swal-ktm-title',
        input: 'swal-ktm-select',
        confirmButton: 'swal-ktm-confirm',
        cancelButton: 'swal-ktm-cancel',
      },
      didOpen: () => {
        const selectEl = Swal.getInput();
        const currentLabel = document.querySelector('.swal-ktm-current strong');
        if (selectEl && currentLabel) {
          selectEl.addEventListener('change', () => {
            const selectedId = (selectEl as unknown as HTMLSelectElement).value;
            if (!selectedId) {
              currentLabel.textContent = 'Sin asignar';
            } else {
              const tec = tecnicos.find(t => String(t.ID_TECNICOS) === selectedId);
              currentLabel.textContent = tec?.Nombre || selectedId;
            }
          });
        }
      },
    });

    if (result.isConfirmed && result.value !== undefined) {
      try {
        setSubmitting(true);

        // Construimos el payload completo conservando los datos actuales pero cambiando el técnico
        const payload: OrdenServicioPayload = {
          ID_CLIENTES: orden.ID_CLIENTES,
          ID_ADMINISTRADOR: orden.ID_ADMINISTRADOR || '',
          ID_TECNICOS: result.value, // <--- Aquí va la nueva asignación
          ID_MOTOS: orden.ID_MOTOS,
          Fecha_inicio: orden.Fecha_inicio,
          Fecha_estimada: orden.Fecha_estimada,
          Fecha_fin: orden.Fecha_fin || '',
          Estado: orden.Estado,
          ClienteNombre: orden.ClienteNombre || '',
        };

        await actualizarOrden(orden.ID_ORDEN_SERVICIO, payload);

        // Mensaje personalizado dependiendo de si asignó o desasignó
        if (result.value === "") {
          showAlert('Desasignado', 'Se ha eliminado la asignación del técnico.', 'success');
        } else {
          const techName = tecnicos.find(t => t.ID_TECNICOS === result.value)?.Nombre || 'Técnico';
          showAlert('Asignado', `Se asignó a ${techName} correctamente.`, 'success');
        }

        await cargarDatosIniciales(); // Recargar tabla
      } catch (err) {
        console.error(err);
        showAlert('Error', 'No se pudo asignar el técnico.', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.ID_CLIENTES) {
      showAlert('Campos requeridos', 'Debe seleccionar un cliente.', 'warning');
      return;
    }

    if (!formData.Fecha_inicio || !formData.Fecha_estimada) {
      showAlert('Fechas requeridas', 'Debe especificar fecha de inicio y fecha estimada.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && selectedOrder) {
        await actualizarOrden(selectedOrder.ID_ORDEN_SERVICIO, formData);
        showAlert('Actualizada', 'La orden se actualizó correctamente', 'success');
      } else {
        await insertarOrden(formData);
        showAlert('Creada', 'Nueva orden de servicio creada', 'success');
      }
      setModalFormOpen(false);
      await cargarDatosIniciales();
    } catch (err) {
      console.error('Error al guardar:', err);
      showAlert('Error', 'No se pudo guardar la orden', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (orden: OrdenServicioRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar orden ${orden.ID_ORDEN_SERVICIO}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#a51f1f',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarOrden(orden.ID_ORDEN_SERVICIO);
      showAlert('Eliminada', 'La orden ha sido eliminada', 'success');
      await cargarDatosIniciales();
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo eliminar la orden', 'error');
    }
  };

  const verDetalles = (orden: OrdenServicioRecord) => {
    setSelectedOrder(orden);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="ordenes-servicio-loading">Cargando órdenes de servicio...</div>;
  }

  return (
    <div className="ordenes-servicio-page">
      <div className="ordenes-servicio-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton />
          <h1 className="ordenes-servicio-title" style={{ margin: 0, borderBottom: 'none' }}>Órdenes de Servicio</h1>
        </div>
        <p className="ordenes-servicio-subtitle">Gestión completa de órdenes (CRUD)</p>

        {/* Barra de acciones */}
        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, cliente, técnico o moto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
              <i className="bi bi-search"></i> Buscar
            </button>
          </div>
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nueva Orden
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-repeat"></i> Reset
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="table-responsive">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Moto</th>
                <th>Fecha inicio</th>
                <th>Fecha estimada</th>
                <th>Fecha fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="loading-row">No hay órdenes que coincidan</td>
                </tr>
              ) : (
                filteredOrdenes.map((orden) => (
                  <tr key={orden.ID_ORDEN_SERVICIO}>
                    <td className="orden-id"><FormattedId entity="orden" value={orden.ID_ORDEN_SERVICIO} /></td>
                    <td>{clientes.find(c => String(c.ID_CLIENTES) === String(orden.ID_CLIENTES))?.Nombre || <FormattedId entity="cliente" value={orden.ID_CLIENTES} />}</td>
                    <td>{orden.ID_TECNICOS ? (tecnicos.find(t => String(t.ID_TECNICOS) === String(orden.ID_TECNICOS))?.Nombre || <FormattedId entity="tecnico" value={orden.ID_TECNICOS} />) : '-'}</td>
                    <td>{orden.ID_MOTOS ? <FormattedId entity="moto" value={orden.ID_MOTOS} /> : '-'}</td>
                    <td>{orden.Fecha_inicio}</td>
                    <td>{orden.Fecha_estimada}</td>
                    <td>{orden.Fecha_fin || '-'}</td>
                    <td className="actions-cell">

                      {/* NUEVO BOTÓN ASIGNAR TÉCNICO */}
                      <button
                        className="btn-edit-ktm"
                        style={{ borderColor: '#198754', color: '#198754' }} // Un toque de color verde en el borde
                        onClick={() => asignarTecnicoRápido(orden)}
                        title="Asignar Técnico"
                      >
                        <i className="bi bi-person-check"></i> Asignar
                      </button>

                      <button className="btn-eliminar-ktm" onClick={() => handleDelete(orden)}>
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                      <button className="btn-edit-ktm" onClick={() => verDetalles(orden)}>
                        <i className="bi bi-eye"></i> Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {modalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la orden {selectedOrder.ID_ORDEN_SERVICIO}</h3>
              <button type="button" className="close-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p><strong>Cliente:</strong> {clientes.find(c => String(c.ID_CLIENTES) === String(selectedOrder.ID_CLIENTES))?.Nombre || selectedOrder.ID_CLIENTES}</p>
              <p><strong>Técnico ID:</strong> {selectedOrder.ID_TECNICOS ?? '-'}</p>
              <p><strong>Moto ID:</strong> {selectedOrder.ID_MOTOS ?? '-'}</p>
              <p><strong>Fecha inicio:</strong> {selectedOrder.Fecha_inicio}</p>
              <p><strong>Fecha estimada:</strong> {selectedOrder.Fecha_estimada}</p>
              <p><strong>Fecha fin:</strong> {selectedOrder.Fecha_fin ?? '-'}</p>
              <p><strong>Estado actual:</strong> {selectedOrder.Estado}</p>

              {selectedOrder.detalles && selectedOrder.detalles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#ff6600', marginBottom: '10px' }}>Servicios / Productos</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', color: '#888' }}>
                        <th style={{ padding: '8px 0' }}>Detalle</th>
                        <th style={{ padding: '8px 0', textAlign: 'center' }}>Cant</th>
                        <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.detalles.map(det => (
                        <tr key={det.id_detalle} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '8px 0', color: '#ccc' }}>{[det.NombreServicio, det.NombreProducto].filter(Boolean).join(' + ') || '-'}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center', color: '#ccc' }}>{det.cantidad}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', color: '#fff' }}>${Number(det.subtotal).toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario (Restaurado a selects originales) */}
      {modalFormOpen && (
        <div className="modal-overlay" onClick={() => setModalFormOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h3>
              <button type="button" className="close-btn" onClick={() => setModalFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    name="ID_CLIENTES"
                    value={formData.ID_CLIENTES}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Seleccione un cliente --</option>
                    {clientes.map(cliente => (
                      <option key={cliente.ID_CLIENTES} value={cliente.ID_CLIENTES}>
                        {cliente.ID_CLIENTES} - {cliente.Nombre}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="form-group">
                  <label>Técnico</label>
                  <select
                    name="ID_TECNICOS"
                    value={formData.ID_TECNICOS}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Seleccione un técnico (opcional) --</option>
                    {tecnicos.map(tec => (
                      <option key={tec.ID_TECNICOS} value={tec.ID_TECNICOS}>
                        {tec.ID_TECNICOS} - {tec.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Moto</label>
                  <select
                    name="ID_MOTOS"
                    value={formData.ID_MOTOS}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Seleccione una moto (opcional) --</option>
                    {motos.map(moto => (
                      <option key={moto.ID_MOTOS} value={moto.ID_MOTOS}>
                        {moto.ID_MOTOS} - {moto.Placa} ({moto.Modelo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha inicio *</label>
                  <input type="date" name="Fecha_inicio" value={formData.Fecha_inicio || ''} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Fecha estimada *</label>
                  <input type="date" name="Fecha_estimada" value={formData.Fecha_estimada || ''} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Fecha fin</label>
                  <input type="date" name="Fecha_fin" value={formData.Fecha_fin ?? ''} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Estado *</label>
                  <select name="Estado" value={formData.Estado} onChange={handleFormChange} required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModalFormOpen(false)}>Cancelar</button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : (editMode ? 'Guardar cambios' : 'Crear orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesServicio;