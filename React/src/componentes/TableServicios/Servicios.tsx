import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  obtenerServicios,
  type ServicioPayload,
} from '../../services/serviciosService';
import './Servicios.css';

// Valores según la base de datos
const CATEGORIAS = ['Mantenimientos', 'Reparaciones', 'Instalaciones', 'Diagnosticos'];
const ESTADOS = ['Disponible', 'No disponible'];

const createInitialFormData = (): ServicioPayload => ({
  ID_SERVICIOS: '',
  Nombre: '',
  Categoria: '',
  Garantia: '',
  Estado: 'Disponible',
  Precio: '',
});

const buildServicioPayload = (formData: ServicioPayload): ServicioPayload => ({
  ID_SERVICIOS: String(formData.ID_SERVICIOS ?? '').trim(),
  Nombre: String(formData.Nombre ?? '').trim(),
  Categoria: String(formData.Categoria ?? '').trim(),
  Garantia: String(formData.Garantia ?? '').trim(),
  Estado: String(formData.Estado ?? '').trim(),
  Precio: formData.Precio === '' ? 0 : Number(formData.Precio),
});

const readServicioArray = (value: unknown): ServicioPayload[] | null => {
  if (Array.isArray(value)) {
    return value as ServicioPayload[];
  }
  if (value && typeof value === 'object') {
    const nestedValue = value as Record<string, unknown>;
    const nestedData = readServicioArray(nestedValue.data);
    if (nestedData) return nestedData;
    const nestedServicios = readServicioArray(nestedValue.servicios);
    if (nestedServicios) return nestedServicios;
  }
  return null;
};

const extractServicios = (payload: unknown): ServicioPayload[] => {
  return readServicioArray(payload) ?? [];
};

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) {
    return true;
  }
  return Boolean((payload as { success?: boolean }).success);
};

const formatPrecio = (precio: ServicioPayload['Precio']) => {
  const numericValue = Number(precio);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }
  return precio;
};

function Servicios() {
  const [servicios, setServicios] = useState<ServicioPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentServicio, setCurrentServicio] = useState<ServicioPayload | null>(null);
  const [formData, setFormData] = useState<ServicioPayload>(createInitialFormData());
  const navigate = useNavigate();

  useEffect(() => {
    void cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const response = await obtenerServicios();
      setServicios(extractServicios(response.data));
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      setServicios([]);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los servicios.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }) as ServicioPayload);
  };

  const openCreateModal = () => {
    setCurrentServicio(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (servicio: ServicioPayload) => {
    setCurrentServicio(servicio);
    setFormData({
      ID_SERVICIOS: servicio.ID_SERVICIOS,
      Nombre: servicio.Nombre,
      Categoria: servicio.Categoria,
      Garantia: servicio.Garantia,
      Estado: servicio.Estado,
      Precio: servicio.Precio,
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentServicio(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    const id = String(formData.ID_SERVICIOS ?? '').trim();
    const nombre = String(formData.Nombre ?? '').trim();
    const categoria = String(formData.Categoria ?? '').trim();
    const garantia = String(formData.Garantia ?? '').trim();
    const estado = String(formData.Estado ?? '').trim();
    const precio = formData.Precio;

    if (!id) return 'El ID del servicio es obligatorio.';
    if (!nombre) return 'El nombre del servicio es obligatorio.';
    if (!categoria) return 'Debe seleccionar una categoría.';
    if (!garantia) return 'La garantía es obligatoria (ej: 30).';
    if (isNaN(Number(garantia))) return 'La garantía debe ser un número (ej: 30).';
    if (!estado) return 'Debe seleccionar un estado.';
    if (!precio || Number(precio) <= 0) return 'Debe ingresar un precio válido mayor a 0.';
    return null;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      await Swal.fire({
        title: 'Datos incompletos',
        text: validationError,
        icon: 'warning',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    try {
      const response = await crearServicio(buildServicioPayload(formData));
      if (isSuccessfulResponse(response.data)) {
        await Swal.fire({
          title: 'Servicio creado',
          text: 'El servicio fue registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
        closeCreateModal();
        await cargarServicios();
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el servicio.',
          icon: 'error',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
      }
    } catch (error) {
      console.error('Error al crear:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al crear el servicio.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentServicio) return;

    const validationError = validateForm();
    if (validationError) {
      await Swal.fire({
        title: 'Datos incompletos',
        text: validationError,
        icon: 'warning',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      return;
    }

    try {
      const response = await actualizarServicio(
        currentServicio.ID_SERVICIOS,
        buildServicioPayload(formData)
      );

      if (isSuccessfulResponse(response.data)) {
        await Swal.fire({
          title: 'Cambios guardados',
          text: 'El servicio fue actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
        closeEditModal();
        await cargarServicios();
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el servicio.',
          icon: 'error',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al actualizar el servicio. Verifica los datos ingresados.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    }
  };

  const borrarServicio = async (servicio: ServicioPayload) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás el servicio "${servicio.Nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarServicio(servicio.ID_SERVICIOS);
      setServicios(prev => prev.filter(item => item.ID_SERVICIOS !== servicio.ID_SERVICIOS));
      await Swal.fire({
        title: 'Eliminado',
        text: 'El servicio fue eliminado correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el servicio.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    }
  };

  const cerrarSesion = () => {
    navigate('/login');
  };

  return (
    <div className="servicios-page">
      <div className="header-admin">
        <button className="btn-logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      <div className="admin-section">
        <h1 className="admin-title">Gestión de Servicios</h1>
        <div className="action-bar">
          <button className="btn-create" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Nuevo Servicio
          </button>
        </div>

        <table className="table-ktm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Garantía (días)</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-row">
                  Cargando servicios...
                </td>
              </tr>
            ) : servicios.length > 0 ? (
              servicios.map(servicio => (
                <tr key={servicio.ID_SERVICIOS}>
                  <td>{servicio.ID_SERVICIOS}</td>
                  <td>{servicio.Nombre}</td>
                  <td>{servicio.Categoria}</td>
                  <td>{servicio.Garantia}</td>
                  <td>{servicio.Estado}</td>
                  <td>${formatPrecio(servicio.Precio)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit-ktm"
                      onClick={() => openEditModal(servicio)}
                      title="Editar"
                    >
                      <i className="bi bi-pencil-square"></i> Editar
                    </button>
                    <button
                      className="btn-eliminar-ktm"
                      onClick={() => borrarServicio(servicio)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash3"></i> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="loading-row">
                  No hay servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Servicio</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>ID Servicio</label>
                <input
                  type="text"
                  name="ID_SERVICIOS"
                  value={formData.ID_SERVICIOS}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Garantía (días)</label>
                <input
                  type="text"
                  name="Garantia"
                  value={formData.Garantia}
                  onChange={handleInputChange}
                  placeholder="Ej: 30"
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="Estado"
                  value={formData.Estado}
                  onChange={handleInputChange}
                  required
                >
                  {ESTADOS.map(est => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precio</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Servicio</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>ID Servicio</label>
                <input
                  type="text"
                  name="ID_SERVICIOS"
                  value={formData.ID_SERVICIOS}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleInputChange}
                  required
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Garantía (días)</label>
                <input
                  type="text"
                  name="Garantia"
                  value={formData.Garantia}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="Estado"
                  value={formData.Estado}
                  onChange={handleInputChange}
                  required
                >
                  {ESTADOS.map(est => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precio</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;