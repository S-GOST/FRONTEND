import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  insertarTecnico,
  actualizarTecnico,
  eliminarTecnico,
  obtenerTecnicoPorId,
  obtenerTecnicos,
  type TecnicoPayload,
  type TecnicoRecord,
} from '../../services/tecnico.service';
import { obtenerTiposDocumento, type TipoDocumentoRecord } from '../../services/tipoDocumento.service';
import { FormattedId } from '../../componentes/FormattedId';
import '../TableAdmin/Admin.css';

type TecnicoFormState = TecnicoPayload & {
  password: string;
  passwordActual: string;
};

const createInitialFormData = (): TecnicoFormState => ({
  numero_documento: '',
  nombre: '',
  correo: '',
  id_tipo_documento: '',
  telefono: '',
  usuario: '',
  password: '',
  passwordActual: '',
});

// --- FUNCIONES AUXILIARES DE VALIDACIÓN ---
const filterOnlyLetters = (value: string): string => value.replace(/[^a-zA-ZñÑ\s]/g, '');
const filterOnlyNumbers = (value: string): string => value.replace(/\D/g, '');

const readTecnicoArray = (value: unknown): TecnicoRecord[] | null => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    const fromData = readTecnicoArray(nested.data);
    if (fromData) return fromData;
    const fromTecnicos = readTecnicoArray(nested.tecnicos);
    if (fromTecnicos) return fromTecnicos;
  }
  return null;
};

const extractTecnicos = (payload: unknown): TecnicoRecord[] =>
  readTecnicoArray(payload) ?? [];

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload))
    return true;
  return Boolean((payload as { success?: boolean }).success);
};

const readTecnicoRecord = (value: unknown): TecnicoRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if ('numero_documento' in candidate)
    return candidate as unknown as TecnicoRecord;
  if ('data' in candidate) return readTecnicoRecord(candidate.data);
  if ('tecnico' in candidate) return readTecnicoRecord(candidate.tecnico);
  return null;
};

const buildTecnicoPayload = (formData: TecnicoFormState): TecnicoPayload => {
  const payload: TecnicoPayload = {
    numero_documento: String(formData.numero_documento).trim(),
    nombre: formData.nombre.trim(),
    correo: formData.correo.trim(),
    id_tipo_documento: formData.id_tipo_documento,
    telefono: formData.telefono.trim(),
    usuario: formData.usuario.trim(),
  };
  if (formData.password.trim()) {
    payload.password = formData.password.trim();
  } else if (formData.passwordActual.trim()) {
    payload.password = formData.passwordActual.trim();
  }
  return payload;
};

function Tecnicos() {
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoRecord[]>([]);
  const [filteredTecnicos, setFilteredTecnicos] = useState<TecnicoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTecnico, setCurrentTecnico] = useState<TecnicoRecord | null>(null);
  const [formData, setFormData] = useState<TecnicoFormState>(createInitialFormData());

  useEffect(() => {
    void cargarTipos();
    void cargarTecnicos();
  }, []);

  const cargarTipos = async () => {
    try {
      const res = await obtenerTiposDocumento();
      const tipos = res.data?.data ?? res.data;
      if (tipos) setTiposDocumento(Array.isArray(tipos) ? tipos : []);
    } catch (e) {
      console.error(e);
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

  const cargarTecnicos = async () => {
    try {
      setLoading(true);
      const response = await obtenerTecnicos();
      const data = extractTecnicos(response.data);
      setTecnicos(data);
      setFilteredTecnicos(data);
    } catch (error) {
      console.error('Error al obtener técnicos:', error);
      setTecnicos([]);
      setFilteredTecnicos([]);
      showAlert('Error', 'No se pudieron cargar los técnicos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredTecnicos(tecnicos);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = tecnicos.filter(tecnico =>
      tecnico.nombre.toLowerCase().includes(term) ||
      tecnico.correo.toLowerCase().includes(term) ||
      tecnico.usuario.toLowerCase().includes(term) ||
      String(tecnico.numero_documento).toLowerCase().includes(term)
    );
    setFilteredTecnicos(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredTecnicos(tecnicos);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ MANEJADOR: SOLO LETRAS (Solo para Nombre)
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

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  // ✅ MANEJADOR: SOLO NÚMEROS (ID Técnico)
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

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const openEditModal = async (tecnico: TecnicoRecord) => {
    const originalId = String(tecnico.numero_documento ?? '').trim();
    if (!originalId) {
      setCurrentTecnico(tecnico);
      setFormData({
        numero_documento: tecnico.numero_documento,
        nombre: tecnico.nombre,
        correo: tecnico.correo,
        id_tipo_documento: tecnico.id_tipo_documento,
        telefono: tecnico.telefono,
        usuario: tecnico.usuario,
        password: '',
        passwordActual: tecnico.password ?? '',
      });
      setShowEditModal(true);
      return;
    }
    try {
      const response = await obtenerTecnicoPorId(originalId);
      const tecnicoActualizado = readTecnicoRecord(response.data) ?? tecnico;
      setCurrentTecnico(tecnicoActualizado);
      setFormData({
        numero_documento: tecnicoActualizado.numero_documento,
        nombre: tecnicoActualizado.nombre,
        correo: tecnicoActualizado.correo,
        id_tipo_documento: tecnicoActualizado.id_tipo_documento,
        telefono: tecnicoActualizado.telefono,
        usuario: tecnicoActualizado.usuario,
        password: '',
        passwordActual: tecnicoActualizado.password ?? '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar técnico para editar:', error);
      setCurrentTecnico(tecnico);
      setFormData({
        numero_documento: tecnico.numero_documento,
        nombre: tecnico.nombre,
        correo: tecnico.correo,
        id_tipo_documento: tecnico.id_tipo_documento,
        telefono: tecnico.telefono,
        usuario: tecnico.usuario,
        password: '',
        passwordActual: tecnico.password ?? '',
      });
      setShowEditModal(true);
    }
  };

  const openCreateModal = () => {
    setCurrentTecnico(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentTecnico(null);
    setFormData(createInitialFormData());
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = buildTecnicoPayload(formData);
      if (!payload.password) {
        showAlert('Atención', 'La contraseña es obligatoria para crear un técnico.', 'warning');
        return;
      }
      const response = await insertarTecnico(payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Técnico creado', 'El nuevo técnico fue registrado correctamente.', 'success');
        closeCreateModal();
        await cargarTecnicos();
      } else {
        showAlert('Error', 'No se pudo crear el técnico.', 'error');
      }
    } catch (error) {
      console.error('Error al crear técnico:', error);
      showAlert('Error', 'Ocurrió un error al crear el técnico.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTecnico) return;
    try {
      const payload = buildTecnicoPayload(formData);
      if (!payload.password) {
        showAlert('Atención', 'Ingresa una contraseña o carga primero la contraseña actual antes de guardar.', 'warning');
        return;
      }
      const response = await actualizarTecnico(currentTecnico.numero_documento, payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Cambios guardados', 'El técnico fue actualizado correctamente.', 'success');
        closeEditModal();
        await cargarTecnicos();
      } else {
        showAlert('Error', 'No se pudo actualizar el técnico.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      showAlert('Error', 'Ocurrió un error al actualizar el técnico.', 'error');
    }
  };

  const borrarTecnico = async (tecnico: TecnicoRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar a ${tecnico.nombre}?`,
      text: "Esta acción no se puede deshacer.",
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
      await eliminarTecnico(tecnico.numero_documento);
      setTecnicos(prev => prev.filter(item => item.numero_documento !== tecnico.numero_documento));
      setFilteredTecnicos(prev => prev.filter(item => item.numero_documento !== tecnico.numero_documento));
      Swal.fire({
        title: 'Eliminado',
        text: 'El técnico ha sido eliminado.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      showAlert('Error', 'Ocurrió un error al eliminar el técnico.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section">
        <h1 className="admin-title">Panel de Técnicos</h1>
        <div className="action-bar">
          {/* Lado izquierdo: búsqueda */}
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, correo, usuario o ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} title="Buscar">
              <i className="bi bi-search"></i>
            </button>
          </div>

          {/* Lado derecho: botones apilados */}
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nuevo Técnico
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-repeat"></i> Reset
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-row">
                    Cargando datos...
                  </td>
                </tr>
              ) : filteredTecnicos.length > 0 ? (
                filteredTecnicos.map(tecnico => (
                  <tr key={tecnico.numero_documento}>
                    <td><FormattedId entity="tecnico" value={tecnico.numero_documento} /></td>
                    <td>{tecnico.nombre}</td>
                    <td>{tecnico.correo}</td>
                    <td>{tiposDocumento.find(t => String(t.id_tipo_documento) === String(tecnico.id_tipo_documento))?.nombre || tecnico.id_tipo_documento}</td>
                    <td>{tecnico.telefono}</td>
                    <td>{tecnico.usuario}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(tecnico)}
                        title="Editar Técnico"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button
                        className="btn-eliminar-ktm"
                        onClick={() => borrarTecnico(tecnico)}
                        title="Eliminar Técnico"
                      >
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="loading-row">
                    No hay técnicos registrados.
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
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Técnico</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Documento Técnico</label>
                <input
                  type="text"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleNumberOnlyInput}
                  required
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
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="id_tipo_documento"
                  value={String(formData.id_tipo_documento || '')}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {tiposDocumento.map(t => (
                    <option key={t.id_tipo_documento} value={String(t.id_tipo_documento)}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usuario</label>
                {/* ✅ CAMBIADO: Usa la misma función que el correo (handleInputChange) */}
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Ingresa la contraseña del técnico"
                  required
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
      {showEditModal && currentTecnico && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Técnico</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Documento Técnico</label>
                <input
                  type="text"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleNumberOnlyInput}
                  required
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
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="id_tipo_documento"
                  value={String(formData.id_tipo_documento || '')}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {tiposDocumento.map(t => (
                    <option key={t.id_tipo_documento} value={String(t.id_tipo_documento)}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usuario</label>
                {/* ✅ CAMBIADO: Usa la misma función que el correo (handleInputChange) */}
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Déjala vacía para mantener la actual"
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tecnicos;