import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerOrdenes,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
  type OrdenServicioRecord,
  type OrdenServicioPayload,
} from '../../services/ordenServicioService';
import { obtenerClientes, type ClienteRecord } from '../../services/cliente.service';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnico.service';
import { obtenerMotos, type MotoRecord } from '../../services/moto.service';
import { obtenerAdmins, type AdminRecord } from '../../services/admin.service';
import { FormattedId } from '../../componentes/FormattedId';
import './OrdenesServicio.css';

// Extractor de datos
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
  const [administradores, setAdministradores] = useState<AdminRecord[]>([]);

  useEffect(() => {
    void cargarDatosIniciales();
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
      const [ordenesRes, clientesRes, tecnicosRes, motosRes, adminRes] = await Promise.all([
        obtenerOrdenes(),
        obtenerClientes(),
        obtenerTecnicos(),
        obtenerMotos(),
        obtenerAdmins(),
      ]);
      const ordenesData = extractOrdenes(ordenesRes.data);
      setOrdenes(ordenesData);
      setFilteredOrdenes(ordenesData);
      setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      setTecnicos(Array.isArray(tecnicosRes.data) ? tecnicosRes.data : []);
      setMotos(Array.isArray(motosRes.data) ? motosRes.data : []);
      setAdministradores(Array.isArray(adminRes.data) ? adminRes.data : []);
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

  // CRUD: Crear / Editar
  const openCreateModal = () => {
    setEditMode(false);
    setFormData(initialFormState);
    setModalFormOpen(true);
  };

  const openEditModal = (orden: OrdenServicioRecord) => {
    setEditMode(true);
    setFormData({
      ID_CLIENTES: orden.ID_CLIENTES,
      ID_ADMINISTRADOR: orden.ID_ADMINISTRADOR || '',
      ID_TECNICOS: orden.ID_TECNICOS || '',
      ID_MOTOS: orden.ID_MOTOS || '',
      Fecha_inicio: orden.Fecha_inicio,
      Fecha_estimada: orden.Fecha_estimada,
      Fecha_fin: orden.Fecha_fin || '',
      Estado: orden.Estado,
      ClienteNombre: orden.ClienteNombre || '',
    });
    setSelectedOrder(orden);
    setModalFormOpen(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && selectedOrder) {
        await actualizarOrden(selectedOrder.ID_ORDEN_SERVICIO, formData);
        showAlert('Actualizada', 'La orden se actualizó correctamente', 'success');
      } else {
        await crearOrden(formData);
        showAlert('Creada', 'Nueva orden de servicio creada', 'success');
      }
      setModalFormOpen(false);
      await cargarDatosIniciales();
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo guardar la orden', 'error');
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
        <h1 className="ordenes-servicio-title">Órdenes de Servicio</h1>
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
                <th>Administrador</th>
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
                    <td><FormattedId entity="cliente" value={orden.ID_CLIENTES} /></td>
                    <td>{orden.ID_ADMINISTRADOR ? <FormattedId entity="admin" value={orden.ID_ADMINISTRADOR} /> : '-'}</td>
                    <td>{orden.ID_TECNICOS ? <FormattedId entity="tecnico" value={orden.ID_TECNICOS} /> : '-'}</td>
                    <td>{orden.ID_MOTOS ? <FormattedId entity="moto" value={orden.ID_MOTOS} /> : '-'}</td>
                    <td>{orden.Fecha_inicio}</td>
                    <td>{orden.Fecha_estimada}</td>
                    <td>{orden.Fecha_fin || '-'}</td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(orden)}>
                        <i className="bi bi-pencil-square"></i> Editar
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

      {/* Modal de detalles (solo información, sin cambio de estado) */}
      {modalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la orden {selectedOrder.ID_ORDEN_SERVICIO}</h3>
              <button type="button" className="close-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Cliente ID:</strong> {selectedOrder.ID_CLIENTES}</p>
              <p><strong>Administrador ID:</strong> {selectedOrder.ID_ADMINISTRADOR ?? '-'}</p>
              <p><strong>Técnico ID:</strong> {selectedOrder.ID_TECNICOS ?? '-'}</p>
              <p><strong>Moto ID:</strong> {selectedOrder.ID_MOTOS ?? '-'}</p>
              <p><strong>Fecha inicio:</strong> {selectedOrder.Fecha_inicio}</p>
              <p><strong>Fecha estimada:</strong> {selectedOrder.Fecha_estimada}</p>
              <p><strong>Fecha fin:</strong> {selectedOrder.Fecha_fin ?? '-'}</p>
              <p><strong>Estado actual:</strong> {selectedOrder.Estado}</p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario (Crear/Editar) - puede cambiar el estado dentro del formulario */}
      {modalFormOpen && (
        <div className="modal-overlay" onClick={() => setModalFormOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h3>
              <button type="button" className="close-btn" onClick={() => setModalFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Cliente - input con datalist */}
                <div className="form-group">
                  <label>Cliente *</label>
                  <input
                    list="clientes-list"
                    name="ID_CLIENTES"
                    value={formData.ID_CLIENTES}
                    onChange={handleFormChange}
                    placeholder="Escribe o selecciona un ID de cliente"
                    autoComplete="off"
                    required
                  />
                  <datalist id="clientes-list">
                    {clientes.map(cliente => (
                      <option key={cliente.ID_CLIENTES} value={cliente.ID_CLIENTES}>
                        {cliente.Nombre} ({cliente.ID_CLIENTES})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Administrador - input con datalist */}
                <div className="form-group">
                  <label>Administrador *</label>
                  <input
                    list="admins-list"
                    name="ID_ADMINISTRADOR"
                    value={formData.ID_ADMINISTRADOR}
                    onChange={handleFormChange}
                    placeholder="Escribe o selecciona un ID de administrador"
                    autoComplete="off"
                    required
                  />
                  <datalist id="admins-list">
                    {administradores.map(admin => (
                      <option key={admin.ID_ADMINISTRADOR} value={admin.ID_ADMINISTRADOR}>
                        {admin.Nombre} ({admin.ID_ADMINISTRADOR})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Técnico - input con datalist */}
                <div className="form-group">
                  <label>Técnico</label>
                  <input
                    list="tecnicos-list"
                    name="ID_TECNICOS"
                    value={formData.ID_TECNICOS}
                    onChange={handleFormChange}
                    placeholder="Escribe o selecciona un ID de técnico"
                    autoComplete="off"
                  />
                  <datalist id="tecnicos-list">
                    {tecnicos.map(tec => (
                      <option key={tec.ID_TECNICOS} value={tec.ID_TECNICOS}>
                        {tec.Nombre} ({tec.ID_TECNICOS})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Moto - input con datalist */}
                <div className="form-group">
                  <label>Moto</label>
                  <input
                    list="motos-list"
                    name="ID_MOTOS"
                    value={formData.ID_MOTOS}
                    onChange={handleFormChange}
                    placeholder="Escribe o selecciona una placa o ID de moto"
                    autoComplete="off"
                  />
                  <datalist id="motos-list">
                    {motos.map(moto => (
                      <option key={moto.ID_MOTOS} value={moto.ID_MOTOS}>
                        {moto.Placa} - {moto.Modelo} ({moto.ID_MOTOS})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Fecha inicio *</label>
                  <input type="date" name="Fecha_inicio" value={formData.Fecha_inicio} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Fecha estimada *</label>
                  <input type="date" name="Fecha_estimada" value={formData.Fecha_estimada} onChange={handleFormChange} required />
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
                <button type="submit">{editMode ? 'Guardar cambios' : 'Crear orden'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesServicio;