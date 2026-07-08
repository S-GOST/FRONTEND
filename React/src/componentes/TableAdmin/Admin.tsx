import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  insertarAdmin,
  actualizarAdmin,
  eliminarAdmin,
  obtenerAdminPorId,
  obtenerAdmins,
  type AdministradorPayload as AdminPayload,
  type AdministradorRecord as AdminRecord,
} from '../../services/admin.service';
import { obtenerTiposDocumento, type TipoDocumentoRecord } from '../../services/tipoDocumento.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Admin.css';

type AdminFormState = AdminPayload & {
  password: string;
  passwordActual: string;
};

const createInitialFormData = (): AdminFormState => ({
  numero_documento: '',
  nombre: '',
  correo: '',
  id_tipo_documento: '',
  telefono: '',
  usuario: '',
  password: '',
  passwordActual: '',
});

// --- 1. VALIDACIÓN: FILTRA SOLO LETRAS ---
const filterOnlyLetters = (value: string): string => {
  return value.replace(/[^a-zA-ZñÑ\s]/g, '');
};

// --- 2. VALIDACIÓN: FILTRA SOLO NÚMEROS ---
// Esta función elimina todo lo que NO sea un dígito (0-9)
const filterOnlyNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

const readAdminArray = (value: unknown): AdminRecord[] | null => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    const fromData = readAdminArray(nested.data);
    if (fromData) return fromData;
    const fromAdmins = readAdminArray(nested.admins);
    if (fromAdmins) return fromAdmins;
  }
  return null;
};

const extractAdmins = (payload: unknown): AdminRecord[] =>
  readAdminArray(payload) ?? [];

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload))
    return true;
  return Boolean((payload as { success?: boolean }).success);
};

const readAdminRecord = (value: unknown): AdminRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if ('numero_documento' in candidate)
    return candidate as unknown as AdminRecord;
  if ('data' in candidate) return readAdminRecord(candidate.data);
  if ('admin' in candidate) return readAdminRecord(candidate.admin);
  return null;
};

const buildAdminPayload = (formData: AdminFormState): AdminPayload => {
  const payload: AdminPayload = {
    numero_documento: String(formData.numero_documento).trim(),
    nombre: formData.nombre.trim(),
    correo: formData.correo.trim(),
    id_tipo_documento: formData.id_tipo_documento,
    telefono: formData.telefono.trim(),
    usuario: formData.usuario.trim(),
  };
  if (formData.password.trim()) {
    payload.password = formData.password.trim();
  }
  return payload;
};

function Admins() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoRecord[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminRecord | null>(null);
  const [formData, setFormData] = useState<AdminFormState>(createInitialFormData());

  useEffect(() => {
    void cargarTipos();
    void cargarAdmins();
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
      confirmButtonColor: '#060504',
      background: '#101010',
      color: '#f5f5f5',
    });
  };

  const cargarAdmins = async () => {
    try {
      setLoading(true);
      const response = await obtenerAdmins();
      const data = extractAdmins(response.data);
      setAdmins(data);
      setFilteredAdmins(data);
    } catch (error) {
      console.error('Error al obtener admins:', error);
      setAdmins([]);
      setFilteredAdmins([]);
      showAlert('Error', 'No se pudieron cargar los administradores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAdminInState = (updatedAdmin: AdminRecord) => {
    setAdmins(prev => {
      const exists = prev.some(a => a.numero_documento === updatedAdmin.numero_documento);
      if (exists) {
        return prev.map(a => a.numero_documento === updatedAdmin.numero_documento ? updatedAdmin : a);
      } else {
        return [...prev, updatedAdmin];
      }
    });

    setFilteredAdmins(prev => {
      let newFiltered = prev.some(a => a.numero_documento === updatedAdmin.numero_documento)
        ? prev.map(a => a.numero_documento === updatedAdmin.numero_documento ? updatedAdmin : a)
        : [...prev, updatedAdmin];

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        newFiltered = newFiltered.filter(admin =>
          admin.nombre.toLowerCase().includes(term) ||
          admin.correo.toLowerCase().includes(term) ||
          admin.usuario.toLowerCase().includes(term) ||
          String(admin.numero_documento).toLowerCase().includes(term)
        );
      }
      return newFiltered;
    });
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredAdmins(admins);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = admins.filter(admin =>
      admin.nombre.toLowerCase().includes(term) ||
      admin.correo.toLowerCase().includes(term) ||
      admin.usuario.toLowerCase().includes(term) ||
      String(admin.numero_documento).toLowerCase().includes(term)
    );
    setFilteredAdmins(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredAdmins(admins);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 3. MANEJADOR: SOLO LETRAS (Nombre y Usuario) ---
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

  // --- 4. MANEJADOR: SOLO NÚMEROS (ID Administrador) ---
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

  const openEditModal = async (admin: AdminRecord) => {
    const originalId = String(admin.numero_documento ?? '').trim();
    if (!originalId) {
      setCurrentAdmin(admin);
      setFormData({
        numero_documento: admin.numero_documento,
        nombre: admin.nombre,
        correo: admin.correo,
        id_tipo_documento: admin.id_tipo_documento,
        telefono: admin.telefono,
        usuario: admin.usuario,
        password: '',
        passwordActual: admin.password ?? '',
      });
      setShowEditModal(true);
      return;
    }
    try {
      const response = await obtenerAdminPorId(originalId);
      const adminActualizado = readAdminRecord(response.data) ?? admin;
      setCurrentAdmin(adminActualizado);
      setFormData({
        numero_documento: adminActualizado.numero_documento,
        nombre: adminActualizado.nombre,
        correo: adminActualizado.correo,
        id_tipo_documento: adminActualizado.id_tipo_documento,
        telefono: adminActualizado.telefono,
        usuario: adminActualizado.usuario,
        password: '',
        passwordActual: adminActualizado.password ?? '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar admin para editar:', error);
      setCurrentAdmin(admin);
      setFormData({
        numero_documento: admin.numero_documento,
        nombre: admin.nombre,
        correo: admin.correo,
        id_tipo_documento: admin.id_tipo_documento,
        telefono: admin.telefono,
        usuario: admin.usuario,
        password: '',
        passwordActual: admin.password ?? '',
      });
      setShowEditModal(true);
    }
  };

  const openCreateModal = () => {
    setCurrentAdmin(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentAdmin(null);
    setFormData(createInitialFormData());
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = buildAdminPayload(formData);
      if (!payload.password) {
        showAlert('Atención', 'La contraseña es obligatoria para crear un administrador.', 'warning');
        return;
      }
      const response = await insertarAdmin(payload);
      if (isSuccessfulResponse(response.data)) {
        let newAdmin = readAdminRecord(response.data);
        if (!newAdmin) {
          newAdmin = {
            numero_documento: formData.numero_documento,
            nombre: formData.nombre,
            correo: formData.correo,
            id_tipo_documento: formData.id_tipo_documento,
            telefono: formData.telefono,
            usuario: formData.usuario,
            password: formData.password,
          };
        }
        updateAdminInState(newAdmin);
        await showAlert('Administrador creado', 'El nuevo administrador fue registrado correctamente.', 'success');
        closeCreateModal();
      } else {
        showAlert('Error', 'No se pudo crear el administrador.', 'error');
      }
    } catch (error) {
      console.error('Error al crear administrador:', error);
      showAlert('Error', 'Ocurrió un error al crear el administrador.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentAdmin) return;
    try {
      const payload = buildAdminPayload(formData);
      const response = await actualizarAdmin(currentAdmin.numero_documento, payload);
      if (isSuccessfulResponse(response.data)) {
        let updatedAdmin = readAdminRecord(response.data);
        if (!updatedAdmin) {
          updatedAdmin = {
            ...currentAdmin,
            ...payload,
            password: payload.password ?? currentAdmin.password,
          };
        }
        updateAdminInState(updatedAdmin);
        await showAlert('Cambios guardados', 'El administrador fue actualizado correctamente.', 'success');
        closeEditModal();
      } else {
        showAlert('Error', 'No se pudo actualizar el administrador.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      showAlert('Error', 'Ocurrió un error al actualizar el administrador.', 'error');
    }
  };

  const borrarAdmin = async (admin: AdminRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar a ${admin.nombre}?`,
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
      await eliminarAdmin(admin.numero_documento);
      setAdmins(prev => prev.filter(item => item.numero_documento !== admin.numero_documento));
      setFilteredAdmins(prev => prev.filter(item => item.numero_documento !== admin.numero_documento));
      Swal.fire({
        title: 'Eliminado',
        text: 'El administrador ha sido eliminado.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      showAlert('Error', 'Ocurrió un error al eliminar el administrador.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section">
        <h1 className="admin-title">Panel de Administración</h1>
        <div className="action-bar">
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

          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nuevo Administrador
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
              ) : filteredAdmins.length > 0 ? (
                filteredAdmins.map(admin => (
                  <tr key={admin.numero_documento}>
                    <td><FormattedId entity="admin" value={admin.numero_documento} /></td>
                    <td>{admin.nombre}</td>
                    <td>{admin.correo}</td>
                    <td>{tiposDocumento.find(t => String(t.id_tipo_documento) === String(admin.id_tipo_documento))?.nombre || admin.id_tipo_documento}</td>
                    <td>{admin.telefono}</td>
                    <td>{admin.usuario}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(admin)}
                        title="Editar Administrador"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button
                        className="btn-eliminar-ktm"
                        onClick={() => borrarAdmin(admin)}
                        title="Eliminar Administrador"
                      >
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="loading-row">
                    No hay administradores registrados.
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
              <h3>Crear Administrador</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Documento Administrador</label>
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
                  placeholder="Ingresa la contraseña del administrador"
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
      {showEditModal && currentAdmin && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Administrador</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Documento Administrador</label>
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

export default Admins;