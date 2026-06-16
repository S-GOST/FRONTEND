import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  obtenerDetallesOrdenes,
  insertarDetalleOrden,
  actualizarDetalleOrden,
  eliminarDetalleOrden,
  type DetalleOrdenServicioRecord,
  type DetalleOrdenServicioPayload,
} from '../../services/detalleOrdenServicioService';
import { obtenerServicios, type ServicioRecord } from '../../services/servicio.service';
import { obtenerProductos, type ProductoPayload } from '../../services/producto.service';
import { obtenerOrdenes, type OrdenServicioRecord } from '../../services/ordenServicioService';
import { FormattedId } from '../../componentes/FormattedId';
import './OrdenesServicio.css';

// ✅ TIPO LOCAL PARA EL FORMULARIO: Omitimos 'Estado' para no mostrarlo en la UI
type DetalleFormState = Omit<DetalleOrdenServicioPayload, 'Estado'> & {
  ID_DETALLES_ORDEN_SERVICIO?: number;
};

const extractArray = <T,>(payload: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    for (const key of Object.keys(obj)) {
      const nested = extractArray(obj[key], fallback);
      if (nested.length) return nested;
    }
  }
  return fallback;
};

const initialFormState: DetalleFormState = {
  ID_DETALLES_ORDEN_SERVICIO: 0,
  ID_ORDEN_SERVICIO: 0,
  ID_SERVICIOS: 0,
  ID_PRODUCTOS: 0,
  Garantia: 0,
  Precio: 0,
};

const DetallesOrden = () => {
  const [detalles, setDetalles] = useState<DetalleOrdenServicioRecord[]>([]);
  const [filteredDetalles, setFilteredDetalles] = useState<DetalleOrdenServicioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [error, setError] = useState<string | null>(null);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDetalle, setCurrentDetalle] = useState<DetalleOrdenServicioRecord | null>(null);

  // ✅ USAMOS EL NUEVO TIPO LOCAL
  const [formData, setFormData] = useState<DetalleFormState>(initialFormState);

  const [servicios, setServicios] = useState<ServicioRecord[]>([]);
  const [productos, setProductos] = useState<ProductoPayload[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenServicioRecord[]>([]);

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
      const [detallesRes, ordenesRes, serviciosRes, productosRes] = await Promise.all([
        obtenerDetallesOrdenes(),
        obtenerOrdenes(),
        obtenerServicios(),
        obtenerProductos(),
      ]);

      const detallesData = extractArray<DetalleOrdenServicioRecord>(detallesRes.data, []);
      const ordenesData = extractArray<OrdenServicioRecord>(ordenesRes.data, []);
      const serviciosData = extractArray<ServicioRecord>(serviciosRes.data, []);
      const productosData = extractArray<ProductoPayload>(productosRes.data, []);

      setDetalles(detallesData);
      setFilteredDetalles(detallesData);
      setOrdenes(ordenesData);
      setServicios(serviciosData);
      setProductos(productosData);
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
    const term = searchTerm.trim().toLowerCase();
    let results = detalles;
    if (filtroEstado !== 'todas') {
      results = results.filter(detalle => detalle.Estado === filtroEstado);
    }
    if (term) {
      results = results.filter(detalle =>
        Number(detalle.ID_DETALLES_ORDEN_SERVICIO).toString().toLowerCase().includes(term) ||
        Number(detalle.ID_ORDEN_SERVICIO).toString().toLowerCase().includes(term) ||
        Number(detalle.ID_SERVICIOS || '').toString().toLowerCase().includes(term) ||
        Number(detalle.ID_PRODUCTOS || '').toString().toLowerCase().includes(term)
      );
    }
    setFilteredDetalles(results);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFiltroEstado('todas');
    setFilteredDetalles(detalles);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentDetalle(null);
    setFormData({ ...initialFormState });
    setModalFormOpen(true);
  };

  const openEditModal = (detalle: DetalleOrdenServicioRecord) => {
    setEditMode(true);
    setCurrentDetalle(detalle);
    // ✅ SIN ESTADO
    setFormData({
      ID_DETALLES_ORDEN_SERVICIO: Number(detalle.ID_DETALLES_ORDEN_SERVICIO),
      ID_ORDEN_SERVICIO: Number(detalle.ID_ORDEN_SERVICIO),
      ID_SERVICIOS: detalle.ID_SERVICIOS ? Number(detalle.ID_SERVICIOS) : 0,
      ID_PRODUCTOS: detalle.ID_PRODUCTOS ? Number(detalle.ID_PRODUCTOS) : 0,
      Garantia: detalle.Garantia ?? 0,
      Precio: detalle.Precio ?? 0,
    });
    setModalFormOpen(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Garantia' || name === 'Precio' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const validarFormulario = (): boolean => {
    const detalleId = formData.ID_DETALLES_ORDEN_SERVICIO;
    if (!detalleId || detalleId === 0 || isNaN(detalleId)) {
      showAlert('Error', 'El ID del detalle es obligatorio', 'error');
      return false;
    }
    if (!editMode && detalleId) {
      const yaExiste = detalles.some(d => d.ID_DETALLES_ORDEN_SERVICIO === detalleId);
      if (yaExiste) {
        showAlert('Error', `El ID "${detalleId}" ya existe. Use uno diferente.`, 'error');
        return false;
      }
    }

    const ordenIdStr = formData.ID_ORDEN_SERVICIO;
    if (!ordenIdStr || ordenIdStr === 0 || isNaN(ordenIdStr)) {
      showAlert('Error', 'El ID de la orden de servicio es obligatorio', 'error');
      return false;
    }

    const ordenIdNum = Number(ordenIdStr);
    const ordenExiste = ordenes.some(o => Number(o.ID_ORDEN_SERVICIO) === ordenIdNum);

    if (!ordenExiste) {
      showAlert('Error', `La orden con ID "${ordenIdStr}" no existe en la base de datos`, 'error');
      return false;
    }

    const tieneServicio = formData.ID_SERVICIOS && formData.ID_SERVICIOS !== 0;
    const tieneProducto = formData.ID_PRODUCTOS && formData.ID_PRODUCTOS !== 0;
    if (!tieneServicio && !tieneProducto) {
      showAlert('Error', 'Debe seleccionar al menos un servicio o un producto', 'error');
      return false;
    }

    if (tieneServicio) {
      const servicioId = formData.ID_SERVICIOS!;
      const existe = servicios.some(s => Number(s.ID_SERVICIOS) === Number(servicioId));
      const esMismoQueOriginal = editMode && currentDetalle && currentDetalle.ID_SERVICIOS === servicioId;
      if (!existe && !esMismoQueOriginal) {
        showAlert('Error', `El servicio con ID "${servicioId}" no existe`, 'error');
        return false;
      }
    }

    if (tieneProducto) {
      const productoId = formData.ID_PRODUCTOS!;
      const existe = productos.some(p => Number(p.ID_PRODUCTOS) === Number(productoId));
      const esMismoQueOriginal = editMode && currentDetalle && currentDetalle.ID_PRODUCTOS === productoId;
      if (!existe && !esMismoQueOriginal) {
        showAlert('Error', `El producto con ID "${productoId}" no existe`, 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    // ✅ CAST SEGURO PARA LA API (El backend puede tener Estado por defecto)
    const payload: any = {
      ID_ORDEN_SERVICIO: Number(formData.ID_ORDEN_SERVICIO),
      ID_SERVICIOS: formData.ID_SERVICIOS ? Number(formData.ID_SERVICIOS) : null,
      ID_PRODUCTOS: formData.ID_PRODUCTOS ? Number(formData.ID_PRODUCTOS) : null,
      Garantia: formData.Garantia,
      Precio: formData.Precio,
    };

    if (!editMode) {
      payload.ID_DETALLES_ORDEN_SERVICIO = Number(formData.ID_DETALLES_ORDEN_SERVICIO);
    }

    try {
      if (editMode && currentDetalle) {
        await actualizarDetalleOrden(currentDetalle.ID_DETALLES_ORDEN_SERVICIO, payload as DetalleOrdenServicioPayload);
        showAlert('Actualizado', 'El detalle se actualizó correctamente', 'success');
      } else {
        await insertarDetalleOrden(payload as DetalleOrdenServicioPayload);
        showAlert('Creado', 'Nuevo detalle de orden creado', 'success');
      }
      setModalFormOpen(false);
      await cargarDatosIniciales();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'No se pudo guardar el detalle';
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.message) errorMsg = err.message;
      showAlert('Error', errorMsg, 'error');
    }
  };

  const handleDelete = async (detalle: DetalleOrdenServicioRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar detalle ${detalle.ID_DETALLES_ORDEN_SERVICIO}?`,
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
      await eliminarDetalleOrden(Number(detalle.ID_DETALLES_ORDEN_SERVICIO));
      showAlert('Eliminado', 'El detalle ha sido eliminado', 'success');
      await cargarDatosIniciales();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'No se pudo eliminar el detalle';
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      showAlert('Error', errorMsg, 'error');
    }
  };

  if (loading) {
    return <div className="ordenes-servicio-loading">Cargando detalles de orden...</div>;
  }

  return (
    <div className="ordenes-servicio-page">
      <div className="ordenes-servicio-section">
        <h1 className="ordenes-servicio-title">Detalles de Orden de Servicio</h1>
        <p className="ordenes-servicio-subtitle">Gestión completa de los detalles (CRUD)</p>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, orden, servicio o producto"
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
              <i className="bi bi-plus-circle"></i> Nuevo Detalle
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
                <th>ID Detalle</th>
                <th>ID Orden</th>
                <th>ID Servicio</th>
                <th>ID Producto</th>
                <th>Garantía</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetalles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="loading-row">No hay registros que coincidan</td>
                </tr>
              ) : (
                filteredDetalles.map((detalle) => (
                  <tr key={detalle.ID_DETALLES_ORDEN_SERVICIO}>
                    <td className="orden-id"><FormattedId entity="detalle" value={detalle.ID_DETALLES_ORDEN_SERVICIO} /></td>
                    <td><FormattedId entity="orden" value={detalle.ID_ORDEN_SERVICIO} /></td>
                    <td>{detalle.ID_SERVICIOS ? <FormattedId entity="servicio" value={detalle.ID_SERVICIOS} /> : '-'}</td>
                    <td>{detalle.ID_PRODUCTOS ? <FormattedId entity="producto" value={detalle.ID_PRODUCTOS} /> : '-'}</td>
                    <td>{detalle.Garantia ?? '-'}</td>
                    <td>{detalle.Precio != null ? detalle.Precio.toLocaleString('es-CO') : '-'}</td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(detalle)}>
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button className="btn-eliminar-ktm" onClick={() => handleDelete(detalle)}>
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/admin/ordenes_servicio" className="btn-search" style={{ textDecoration: 'none' }}>
            <i className="bi bi-arrow-left"></i> Volver a Órdenes de Servicio
          </Link>
        </div>
      </div>

      {/* Modal con selects mejorados y sin campo Estado */}
      {modalFormOpen && (
        <div className="modal-overlay" onClick={() => setModalFormOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Detalle' : 'Nuevo Detalle de Orden'}</h3>
              <button type="button" className="close-btn" onClick={() => setModalFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ID Detalle *</label>
                  <input
                    type="number"
                    name="ID_DETALLES_ORDEN_SERVICIO"
                    value={formData.ID_DETALLES_ORDEN_SERVICIO}
                    onChange={handleFormChange}
                    required={!editMode}
                    disabled={editMode}
                    placeholder="Ej: 1, 2, 3..."
                    min="1"
                    step="1"
                  />
                  {editMode && <small className="text-muted">El ID no se puede modificar</small>}
                </div>

                <div className="form-group">
                  <label>ID Orden de Servicio *</label>
                  <select
                    name="ID_ORDEN_SERVICIO"
                    value={formData.ID_ORDEN_SERVICIO}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Seleccione una orden --</option>
                    {ordenes.map(ord => (
                      <option key={ord.ID_ORDEN_SERVICIO} value={ord.ID_ORDEN_SERVICIO}>
                        {ord.ID_ORDEN_SERVICIO} - {ord.ClienteNombre || 'Cliente:'} ({ord.Fecha_inicio || ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Servicio (opcional, pero al menos uno)</label>
                  <select
                    name="ID_SERVICIOS"
                    value={formData.ID_SERVICIOS}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Seleccione un servicio (opcional) --</option>
                    {servicios.map(serv => (
                      <option key={serv.ID_SERVICIOS} value={serv.ID_SERVICIOS}>
                        {serv.ID_SERVICIOS} - {serv.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Producto (opcional, pero al menos uno)</label>
                  <select
                    name="ID_PRODUCTOS"
                    value={formData.ID_PRODUCTOS}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Seleccione un producto (opcional) --</option>
                    {productos.map(prod => (
                      <option key={prod.ID_PRODUCTOS} value={prod.ID_PRODUCTOS}>
                        {prod.ID_PRODUCTOS} - {prod.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Garantía (meses)</label>
                  <input
                    type="number"
                    name="Garantia"
                    value={formData.Garantia}
                    onChange={handleFormChange}
                    placeholder="Ej: 6"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModalFormOpen(false)}>Cancelar</button>
                <button type="submit">{editMode ? 'Guardar cambios' : 'Crear detalle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallesOrden;