import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  crearAdmin,
  actualizarAdmin,
  eliminarAdmin,
  obtenerAdminPorId,
  obtenerAdmins,
  type AdminPayload,
  type AdminRecord,
} from '../../services/adminService';
import './Admin.css';

type AdminFormState = AdminPayload & {
  contrasena: string;
  contrasenaActual: string;
};

const tipoDocumentoOptions = [
  'CC',
  'CE',
  'TI',
  'Pasaporte',
  'Cedula de ciudadania',
  'Cedula de extranjeria',
  'Tarjeta de identidad',
];

const createInitialFormData = (): AdminFormState => ({
  ID_ADMINISTRADOR: '',
  Nombre: '',
  Correo: '',
  TipoDocumento: '',
  Telefono: '',
  usuario: '',
  contrasena: '',
  contrasenaActual: '',
});

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
  if ('ID_ADMINISTRADOR' in candidate)
    return candidate as unknown as AdminRecord;
  if ('data' in candidate) return readAdminRecord(candidate.data);
  if ('admin' in candidate) return readAdminRecord(candidate.admin);
  return null;
};

const buildAdminPayload = (formData: AdminFormState): AdminPayload => {
  const payload: AdminPayload = {
    ID_ADMINISTRADOR: String(formData.ID_ADMINISTRADOR).trim(),
    Nombre: formData.Nombre.trim(),
    Correo: formData.Correo.trim(),
    TipoDocumento: formData.TipoDocumento,
    Telefono: formData.Telefono.trim(),
    usuario: formData.usuario.trim(),
  };
  if (formData.contrasena.trim()) {
    payload.contrasena = formData.contrasena.trim();
  } 

  return payload;
};

function Admins() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminRecord | null>(null);
  const [formData, setFormData] = useState<AdminFormState>(createInitialFormData());

  useEffect(() => {
    void cargarAdmins();
  }, []);

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

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredAdmins(admins);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = admins.filter(admin =>
      admin.Nombre.toLowerCase().includes(term) ||
      admin.Correo.toLowerCase().includes(term) ||
      admin.usuario.toLowerCase().includes(term) ||
      String(admin.ID_ADMINISTRADOR).toLowerCase().includes(term)
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

  const openEditModal = async (admin: AdminRecord) => {
    const originalId = String(admin.ID_ADMINISTRADOR ?? '').trim();
    if (!originalId) {
      setCurrentAdmin(admin);
      setFormData({
        ID_ADMINISTRADOR: admin.ID_ADMINISTRADOR,
        Nombre: admin.Nombre,
        Correo: admin.Correo,
        TipoDocumento: admin.TipoDocumento,
        Telefono: admin.Telefono,
        usuario: admin.usuario,
        contrasena: '',
        contrasenaActual: admin.contrasena ?? '',
      });
      setShowEditModal(true);
      return;
    }
    try {
      const response = await obtenerAdminPorId(originalId);
      const adminActualizado = readAdminRecord(response.data) ?? admin;
      setCurrentAdmin(adminActualizado);
      setFormData({
        ID_ADMINISTRADOR: adminActualizado.ID_ADMINISTRADOR,
        Nombre: adminActualizado.Nombre,
        Correo: adminActualizado.Correo,
        TipoDocumento: adminActualizado.TipoDocumento,
        Telefono: adminActualizado.Telefono,
        usuario: adminActualizado.usuario,
        contrasena: '',
        contrasenaActual: adminActualizado.contrasena ?? '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar admin para editar:', error);
      setCurrentAdmin(admin);
      setFormData({
        ID_ADMINISTRADOR: admin.ID_ADMINISTRADOR,
        Nombre: admin.Nombre,
        Correo: admin.Correo,
        TipoDocumento: admin.TipoDocumento,
        Telefono: admin.Telefono,
        usuario: admin.usuario,
        contrasena: '',
        contrasenaActual: admin.contrasena ?? '',
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
      if (!payload.contrasena) {
        showAlert('Atención', 'La contraseña es obligatoria para crear un administrador.', 'warning');
        return;
      }
      const response = await crearAdmin(payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Administrador creado', 'El nuevo administrador fue registrado correctamente.', 'success');
        closeCreateModal();
        await cargarAdmins();
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
      if (!payload.contrasena) {
        showAlert('Atención', 'Ingresa una contraseña o carga primero la contraseña actual antes de guardar.', 'warning');
        return;
      }
      const response = await actualizarAdmin(currentAdmin.ID_ADMINISTRADOR, payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Cambios guardados', 'El administrador fue actualizado correctamente.', 'success');
        closeEditModal();
        await cargarAdmins();
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
      title: `¿Estás seguro de eliminar a ${admin.Nombre}?`,
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
      await eliminarAdmin(admin.ID_ADMINISTRADOR);
      setAdmins(prev => prev.filter(item => item.ID_ADMINISTRADOR !== admin.ID_ADMINISTRADOR));
      setFilteredAdmins(prev => prev.filter(item => item.ID_ADMINISTRADOR !== admin.ID_ADMINISTRADOR));
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
                  <tr key={admin.ID_ADMINISTRADOR}>
                    <td>{admin.ID_ADMINISTRADOR}</td>
                    <td>{admin.Nombre}</td>
                    <td>{admin.Correo}</td>
                    <td>{admin.TipoDocumento}</td>
                    <td>{admin.Telefono}</td>
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
                <label>ID Administrador</label>
                <input
                  type="text"
                  name="ID_ADMINISTRADOR"
                  value={formData.ID_ADMINISTRADOR}
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
                <label>Correo</label>
                <input
                  type="email"
                  name="Correo"
                  value={formData.Correo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="TipoDocumento"
                  value={formData.TipoDocumento}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {tipoDocumentoOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="Telefono"
                  value={formData.Telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usuario</label>
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
                  name="contrasena"
                  value={formData.contrasena}
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
                <label>ID Administrador</label>
                <input
                  type="text"
                  name="ID_ADMINISTRADOR"
                  value={formData.ID_ADMINISTRADOR}
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
                <label>Correo</label>
                <input
                  type="email"
                  name="Correo"
                  value={formData.Correo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="TipoDocumento"
                  value={formData.TipoDocumento}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {tipoDocumentoOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {formData.TipoDocumento &&
                    !tipoDocumentoOptions.includes(formData.TipoDocumento) && (
                      <option value={formData.TipoDocumento}>{formData.TipoDocumento}</option>
                    )}
                </select>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="Telefono"
                  value={formData.Telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usuario</label>
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
                  name="contrasena"
                  value={formData.contrasena}
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