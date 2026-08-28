import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  actualizarServicio,
  insertarServicio,
  eliminarServicio,
  habilitarServicio,
  obtenerServicios,
  type ServicioPayload,
} from '../../services/servicio.service';
import {
  obtenerCategoriasPorTipo,
  type CategoriaPayload,
} from '../../services/categoria.service';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import './Servicios.css';
import { extractArray } from '../../utils/apiHelpers';

const ESTADOS = ['Disponible', 'No disponible'] as const;
type EstadoType = (typeof ESTADOS)[number]; // 'Disponible' | 'No disponible'

const createInitialFormData = (): ServicioPayload => ({
  ID_SERVICIOS: '',
  ID_CATEGORIA: '',
  Nombre: '',
  Estado: 'Disponible',
  Precio: 0,
});

// ✅ FUNCIONES AUXILIARES DE VALIDACIÓN
const filterOnlyLetters = (value: string): string => value.replace(/[^a-zA-ZñÑ\s]/g, '');
const filterOnlyNumbers = (value: string): string => value.replace(/\D/g, '');

/**
 * Construye el payload asegurando que los tipos coincidan con la API.
 */
const buildServicioPayload = (formData: ServicioPayload): ServicioPayload => {
  const id = String(formData.ID_SERVICIOS ?? '').trim();
  const idCategoria = Number(formData.ID_CATEGORIA);
  const nombre = String(formData.Nombre ?? '').trim();
  const estado = String(formData.Estado ?? '').trim() as EstadoType;
  const precio = Number(formData.Precio);

  return {
    ID_SERVICIOS: id,
    ID_CATEGORIA: idCategoria,
    Nombre: nombre,
    Estado: estado,
    Precio: precio,
  };
};

const readServicioArray = (value: unknown): ServicioPayload[] | null => {
  if (Array.isArray(value)) return value as ServicioPayload[];
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    const fromData = readServicioArray(nested.data);
    if (fromData) return fromData;
    const fromServicios = readServicioArray(nested.servicios);
    if (fromServicios) return fromServicios;
  }
  return null;
};


const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) return true;
  return Boolean((payload as { success?: boolean }).success);
};

const formatPrecio = (precio: ServicioPayload['Precio']) => {
  const numericValue = Number(precio);
  if (Number.isFinite(numericValue)) return numericValue.toLocaleString();
  return precio;
};

const getEstadoBadgeClass = (estado?: string) => {
  if (estado === 'Disponible' || estado === 'Activo') return 'bg-success';
  if (estado === 'No disponible' || estado === 'Inactivo') return 'bg-secondary';
  return 'bg-danger';
};

function Servicios() {
  const [servicios, setServicios] = useState<ServicioPayload[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<ServicioPayload[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentServicio, setCurrentServicio] = useState<ServicioPayload | null>(null);
  const [formData, setFormData] = useState<ServicioPayload>(createInitialFormData());

  useEffect(() => {
    void cargarServicios();
    void cargarCategorias();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await obtenerCategoriasPorTipo('SERVICIO');
      const data = response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cats = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

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

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const response = await obtenerServicios();
      const data = extractArray<ServicioPayload>(response.data);
      setServicios(data);
      setFilteredServicios(data);
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      setServicios([]);
      setFilteredServicios([]);
      showAlert('Error', 'No se pudieron cargar los servicios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredServicios(servicios);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = servicios.filter(
      (servicio) =>
        String(servicio.Nombre).toLowerCase().includes(term) ||
        String(servicio.categoria_nombre ?? '').toLowerCase().includes(term) ||
        String(servicio.ID_SERVICIOS).toLowerCase().includes(term) ||
        String(servicio.Estado).toLowerCase().includes(term)
    );
    setFilteredServicios(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredServicios(servicios);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as ServicioPayload);
  };

  // ✅ MANEJADOR: SOLO LETRAS (Nombre)
  const handleTextOnlyInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const sanitizedValue = filterOnlyLetters(value);

    if (value !== sanitizedValue) {
      Swal.fire({
        title: 'Solo letras permitidas',
        text: 'No se permiten números ni símbolos en este campo.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#101010',
        color: '#f5f5f5',
      });
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }) as ServicioPayload);
  };

  // ✅ MANEJADOR: SOLO NÚMEROS (ID Servicio)
  const handleNumberOnlyInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const sanitizedValue = filterOnlyNumbers(value);

    if (value !== sanitizedValue) {
      Swal.fire({
        title: 'Solo números permitidos',
        text: 'El ID solo acepta dígitos numéricos.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#101010',
        color: '#f5f5f5',
      });
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }) as ServicioPayload);
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
      ID_CATEGORIA: servicio.ID_CATEGORIA,
      Nombre: servicio.Nombre,
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
    const idCategoria = Number(formData.ID_CATEGORIA);
    const nombre = String(formData.Nombre ?? '').trim();
    const estado = String(formData.Estado ?? '').trim();
    const precio = formData.Precio;

    if (!id) return 'El ID del servicio es obligatorio.';
    if (!idCategoria) return 'Debe seleccionar una categoría.';
    if (!nombre) return 'El nombre del servicio es obligatorio.';
    if (!estado) return 'Debe seleccionar un estado.';
    if (!precio || Number(precio) <= 0) return 'Debe ingresar un precio válido mayor a 0.';
    return null;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const payload = buildServicioPayload(formData);
      const response = await insertarServicio(payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Servicio creado', 'El servicio fue registrado correctamente.', 'success');
        closeCreateModal();
        await cargarServicios();
      } else {
        showAlert('Error', 'No se pudo crear el servicio.', 'error');
      }
    } catch (err) {
      console.error('Error al crear:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al crear el servicio.';
      showAlert('Error', message, 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentServicio) return;
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const payload = buildServicioPayload(formData);
      const response = await actualizarServicio(currentServicio.ID_SERVICIOS, payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Cambios guardados', 'El servicio fue actualizado correctamente.', 'success');
        closeEditModal();
        await cargarServicios();
      } else {
        showAlert('Error', 'No se pudo actualizar el servicio.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el servicio.';
      showAlert('Error', message, 'error');
    }
  };

  // ✅ ELIMINAR (Inhabilitar) un servicio
  const borrarServicio = async (servicio: ServicioPayload) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de inhabilitar "${servicio.Nombre}"?`,
      text: 'El servicio será marcado como Inactivo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, inhabilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarServicio(servicio.ID_SERVICIOS);
      const updateFn = (prev: ServicioPayload[]) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prev.map((s) => (s.ID_SERVICIOS === servicio.ID_SERVICIOS ? { ...s, Estado: 'Inactivo' as any } : s));
      setServicios(updateFn);
      setFilteredServicios(updateFn);
      Swal.fire({
        title: 'Inhabilitado',
        text: 'El servicio fue inhabilitado correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error al inhabilitar:', err);
      showAlert('Error', 'No se pudo inhabilitar el servicio.', 'error');
    }
  };

  // ✅ RESTAURAR (Habilitar) un servicio
  const restaurarServicio = async (servicio: ServicioPayload) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de habilitar "${servicio.Nombre}"?`,
      text: 'El servicio volverá a estar activo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, habilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await habilitarServicio(servicio.ID_SERVICIOS);
      const updateFn = (prev: ServicioPayload[]) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prev.map((s) => (s.ID_SERVICIOS === servicio.ID_SERVICIOS ? { ...s, Estado: 'Activo' as any } : s));
      setServicios(updateFn);
      setFilteredServicios(updateFn);
      Swal.fire({
        title: 'Habilitado',
        text: 'El servicio fue habilitado correctamente.',
        icon: 'success',
        confirmButtonColor: '#28a745',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error al habilitar:', err);
      showAlert('Error', 'No se pudo habilitar el servicio.', 'error');
    }
  };

  // Helper: obtener nombre de categoría por ID
  const getCategoriaNombre = (servicio: ServicioPayload): string => {
    if (servicio.categoria_nombre) return servicio.categoria_nombre;
    const cat = categorias.find((c) => c.ID_CATEGORIA === Number(servicio.ID_CATEGORIA));
    return cat?.nombre ?? String(servicio.ID_CATEGORIA);
  };

  return (
    <div className="servicios-page">
      <div className="header-admin">{/* Botón de logout si se desea */}</div>

      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton />
          <h1 className="admin-title" style={{ margin: 0, borderBottom: 'none' }}>Gestión de Servicios</h1>
        </div>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, categoría o ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} title="Buscar">
              <i className="bi bi-search"></i>
            </button>
          </div>
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nuevo Servicio
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-repeat"></i> Reset
            </button>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="loading-row">
                    Cargando servicios...
                  </td>
                </tr>
              ) : filteredServicios.length > 0 ? (
                filteredServicios.map((servicio) => (
                  <tr key={servicio.ID_SERVICIOS}>
                    <td><FormattedId entity="servicio" value={servicio.ID_SERVICIOS} /></td>
                    <td>{getCategoriaNombre(servicio)}</td>
                    <td>{servicio.Nombre}</td>
                    <td>
                      <span className={`estado-badge ${getEstadoBadgeClass(servicio.Estado)}`}>
                        {servicio.Estado}
                      </span>
                    </td>
                    <td>${formatPrecio(servicio.Precio)}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(servicio)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                       {String(servicio.Estado) === 'Inactivo' ? (
                         <button
                           className="btn-eliminar-ktm"
                           onClick={() => restaurarServicio(servicio)}
                           title="Habilitar"
                           style={{ backgroundColor: '#28a745', color: '#fff' }}
                         >
                           <i className="bi bi-check-circle"></i> Habilitar
                         </button>
                       ) : (
                         <button
                           className="btn-eliminar-ktm"
                           onClick={() => borrarServicio(servicio)}
                           title="Inhabilitar"
                         >
                           <i className="bi bi-slash-circle"></i> Inhabilitar
                         </button>
                       )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="loading-row">
                    No hay servicios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Servicio</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="ktm-form">
              <div className="ktm-form-body">
                <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-0"><i className="bi bi-hash"></i> ID Servicio</label>
                <input
                  id="serv-0"
                  type="text"
                  name="ID_SERVICIOS"
                  className="ktm-form-input"
                  placeholder="Ej: SER001"
                  value={formData.ID_SERVICIOS}
                  onChange={handleNumberOnlyInput}
                  required
                />
              </div>
              <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-1"><i className="bi bi-tags"></i> Categoría</label>
                <select
                  id="serv-1"
                  name="ID_CATEGORIA"
                  className="ktm-form-input"
                  value={formData.ID_CATEGORIA}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {categorias.map((cat) => (
                    <option key={cat.ID_CATEGORIA} value={cat.ID_CATEGORIA}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-2"><i className="bi bi-card-text"></i> Nombre</label>
                <input
                  id="serv-2"
                  type="text"
                  name="Nombre"
                  className="ktm-form-input"
                  placeholder="Ej: Mantenimiento Preventivo"
                  value={formData.Nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="ktm-form-row">
                <div className="ktm-form-group">
                  <label className="ktm-form-label" htmlFor="serv-3"><i className="bi bi-activity"></i> Estado</label>
                  <select
                  id="serv-3"
                    name="Estado"
                    className="ktm-form-input"
                    value={formData.Estado}
                    onChange={handleInputChange}
                    required
                  >
                    {ESTADOS.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ktm-form-group">
                  <label className="ktm-form-label" htmlFor="serv-4"><i className="bi bi-currency-dollar"></i> Precio</label>
                  <input
                  id="serv-4"
                    type="number"
                    step="0.01"
                    name="Precio"
                    className="ktm-form-input"
                    placeholder="Ej: 50000"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
      {showEditModal && currentServicio && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-pencil-square"></i> Editar Servicio</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate} className="ktm-form">
              <div className="ktm-form-body">
                <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-5"><i className="bi bi-hash"></i> ID Servicio</label>
                <input
                  id="serv-5"
                  type="text"
                  name="ID_SERVICIOS"
                  className="ktm-form-input"
                  value={formData.ID_SERVICIOS}
                  required
                  readOnly
                  title="El ID no se puede modificar"
                />
              </div>
              <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-6"><i className="bi bi-tags"></i> Categoría</label>
                <select
                  id="serv-6"
                  name="ID_CATEGORIA"
                  className="ktm-form-input"
                  value={formData.ID_CATEGORIA}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {categorias.map((cat) => (
                    <option key={cat.ID_CATEGORIA} value={cat.ID_CATEGORIA}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ktm-form-group">
                <label className="ktm-form-label" htmlFor="serv-7"><i className="bi bi-card-text"></i> Nombre</label>
                <input
                  id="serv-7"
                  type="text"
                  name="Nombre"
                  className="ktm-form-input"
                  value={formData.Nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="ktm-form-row">
                <div className="ktm-form-group">
                  <label className="ktm-form-label" htmlFor="serv-8"><i className="bi bi-activity"></i> Estado</label>
                  <select
                  id="serv-8"
                    name="Estado"
                    className="ktm-form-input"
                    value={formData.Estado}
                    onChange={handleInputChange}
                    required
                  >
                    {ESTADOS.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ktm-form-group">
                  <label className="ktm-form-label" htmlFor="serv-9"><i className="bi bi-currency-dollar"></i> Precio</label>
                  <input
                  id="serv-9"
                    type="number"
                    step="0.01"
                    name="Precio"
                    className="ktm-form-input"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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