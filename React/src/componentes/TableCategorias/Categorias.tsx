import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerCategorias,
  insertarCategoria,
  actualizarCategoria,
  eliminarCategoria,
  habilitarCategoria,
  type CategoriaPayload,
} from '../../services/categoria.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Categorias.css';

const TIPOS_CATEGORIA = ['PRODUCTO', 'SERVICIO'] as const;
export type TipoCategoria = (typeof TIPOS_CATEGORIA)[number];

const createInitialFormData = (): CategoriaPayload => ({
  nombre: '',
  tipo: 'PRODUCTO',
  descripcion: '',
});

// ✅ FUNCIONES AUXILIARES DE VALIDACIÓN
const filterOnlyLetters = (value: string): string => value.replace(/[^a-zA-ZñÑ\s]/g, '');

const extractCategorias = (payload: unknown): CategoriaPayload[] => {
  if (Array.isArray(payload)) return payload as CategoriaPayload[];
  if (payload && typeof payload === 'object') {
    const data = (payload as any).data;
    if (Array.isArray(data)) return data as CategoriaPayload[];
  }
  return [];
};

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) return true;
  return Boolean((payload as { success?: boolean }).success);
};

function Categorias() {
  const [categorias, setCategorias] = useState<CategoriaPayload[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<CategoriaPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<CategoriaPayload | null>(null);
  const [formData, setFormData] = useState<CategoriaPayload>(createInitialFormData());

  useEffect(() => {
    void cargarCategorias();
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

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const response = await obtenerCategorias();
      const data = extractCategorias(response.data);
      setCategorias(data);
      setFilteredCategorias(data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      setCategorias([]);
      setFilteredCategorias([]);
      showAlert('Error', 'No se pudieron cargar las categorías.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCategorias(categorias);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = categorias.filter(
      (cat) =>
        String(cat.nombre).toLowerCase().includes(term) ||
        String(cat.tipo).toLowerCase().includes(term) ||
        String(cat.descripcion ?? '').toLowerCase().includes(term)
    );
    setFilteredCategorias(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredCategorias(categorias);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as CategoriaPayload);
  };

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

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }) as CategoriaPayload);
  };

  const openCreateModal = () => {
    setCurrentCategoria(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (categoria: CategoriaPayload) => {
    setCurrentCategoria(categoria);
    setFormData({ ...categoria });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentCategoria(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    const nombre = String(formData.nombre ?? '').trim();
    const tipo = String(formData.tipo ?? '').trim();

    if (!nombre) return 'El nombre de la categoría es obligatorio.';
    if (!tipo) return 'Debe seleccionar un tipo (PRODUCTO o SERVICIO).';
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
      const response = await insertarCategoria(formData);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Categoría creada', 'La categoría fue registrada correctamente.', 'success');
        closeCreateModal();
        await cargarCategorias();
      } else {
        showAlert('Error', 'No se pudo crear la categoría.', 'error');
      }
    } catch (err) {
      console.error('Error al crear:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al crear la categoría.';
      showAlert('Error', message, 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentCategoria || !currentCategoria.ID_CATEGORIA) return;
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const response = await actualizarCategoria(currentCategoria.ID_CATEGORIA, formData);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Cambios guardados', 'La categoría fue actualizada correctamente.', 'success');
        closeEditModal();
        await cargarCategorias();
      } else {
        showAlert('Error', 'No se pudo actualizar la categoría.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al actualizar la categoría.';
      showAlert('Error', message, 'error');
    }
  };

  const borrarCategoria = async (categoria: CategoriaPayload) => {
    if (!categoria.ID_CATEGORIA) return;
    
    const result = await Swal.fire({
      title: `¿Estás seguro de inhabilitar "${categoria.nombre}"?`,
      text: 'Se verificará si tiene servicios o productos asociados.',
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
      await eliminarCategoria(categoria.ID_CATEGORIA);
      actualizarEstadoLocal(categoria.ID_CATEGORIA);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const confirmResult = await Swal.fire({
          title: 'Atención',
          text: err.response.data.message,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ff6600',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí, inhabilitar todo',
          cancelButtonText: 'Cancelar',
          background: '#101010',
          color: '#f5f5f5',
        });
        if (confirmResult.isConfirmed) {
            try {
                await eliminarCategoria(categoria.ID_CATEGORIA, true);
                actualizarEstadoLocal(categoria.ID_CATEGORIA);
            } catch (e) {
                console.error('Error al inhabilitar dependencias:', e);
                showAlert('Error', 'No se pudo inhabilitar la categoría.', 'error');
            }
        }
      } else {
        console.error('Error al inhabilitar:', err);
        showAlert('Error', 'No se pudo inhabilitar la categoría.', 'error');
      }
    }
  };

  const actualizarEstadoLocal = (id: number) => {
      const updateFn = (prev: CategoriaPayload[]) => prev.map(c => c.ID_CATEGORIA === id ? { ...c, estado: 'Inactivo' } : c);
      setCategorias(updateFn);
      setFilteredCategorias(updateFn);
      Swal.fire({
        title: 'Inhabilitada',
        text: 'La categoría fue inhabilitada correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
  };

  const restaurarCategoria = async (categoria: CategoriaPayload) => {
    if (!categoria.ID_CATEGORIA) return;
    
    const result = await Swal.fire({
      title: `¿Estás seguro de habilitar "${categoria.nombre}"?`,
      text: 'La categoría volverá a estar activa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, habilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    
    try {
      await habilitarCategoria(categoria.ID_CATEGORIA);
      
      const updateFn = (prev: CategoriaPayload[]) => prev.map(c => c.ID_CATEGORIA === categoria.ID_CATEGORIA ? { ...c, estado: 'Activo' } : c);
      setCategorias(updateFn);
      setFilteredCategorias(updateFn);
      
      Swal.fire({
        title: 'Habilitada',
        text: 'La categoría fue habilitada correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error al habilitar:', err);
      showAlert('Error', 'No se pudo habilitar la categoría.', 'error');
    }
  };

  return (
    <div className="categorias-page">
      <div className="header-admin">{/* Botón de logout si se desea */}</div>

      <div className="admin-section">
        <h1 className="admin-title">Gestión de Categorías</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, tipo o descripción"
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
              <i className="bi bi-plus-circle"></i> Nueva Categoría
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
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="loading-row">
                    Cargando categorías...
                  </td>
                </tr>
              ) : filteredCategorias.length > 0 ? (
                filteredCategorias.map((cat) => (
                  <tr key={cat.ID_CATEGORIA}>
                    <td><FormattedId entity="categoria" value={cat.ID_CATEGORIA} /></td>
                    <td>{cat.nombre}</td>
                    <td>
                      <span className={cat.tipo === 'PRODUCTO' ? 'badge bg-primary' : 'badge bg-info'}>
                        {cat.tipo}
                      </span>
                    </td>
                    <td>{cat.descripcion || '-'}</td>
                    <td>
                      <span className={cat.estado === 'Inactivo' ? 'badge bg-secondary' : 'badge bg-success'}>
                        {cat.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(cat)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      {cat.estado === 'Inactivo' ? (
                        <button
                          className="btn-eliminar-ktm"
                          onClick={() => restaurarCategoria(cat)}
                          title="Habilitar"
                          style={{ backgroundColor: '#28a745', color: '#fff' }}
                        >
                          <i className="bi bi-check-circle"></i> Habilitar
                        </button>
                      ) : (
                        <button
                          className="btn-eliminar-ktm"
                          onClick={() => borrarCategoria(cat)}
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
                  <td colSpan={5} className="loading-row">
                    No hay categorías registradas.
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
              <h3>Crear Categoría</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                >
                  {TIPOS_CATEGORIA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleInputChange}
                  rows={3}
                />
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
      {showEditModal && currentCategoria && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Categoría</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>ID Categoría</label>
                <input
                  type="text"
                  value={formData.ID_CATEGORIA || ''}
                  disabled
                  title="El ID no se puede modificar"
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                >
                  {TIPOS_CATEGORIA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleInputChange}
                  rows={3}
                />
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

export default Categorias;
