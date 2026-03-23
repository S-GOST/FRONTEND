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
  if (Array.isArray(value)) {
    return value as AdminRecord[];
  }

  if (value && typeof value === 'object') {
    const nestedValue = value as Record<string, unknown>;
    const nestedData = readAdminArray(nestedValue.data);

    if (nestedData) {
      return nestedData;
    }

    const nestedAdmins = readAdminArray(nestedValue.admins);

    if (nestedAdmins) {
      return nestedAdmins;
    }
  }

  return null;
};

const extractAdmins = (payload: unknown): AdminRecord[] => {
  return readAdminArray(payload) ?? [];
};

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) {
    return true;
  }

  return Boolean((payload as { success?: boolean }).success);
};

const readAdminRecord = (value: unknown): AdminRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if ('ID_ADMINISTRADOR' in candidate) {
    return candidate as unknown as AdminRecord;
  }

  if ('data' in candidate) {
    return readAdminRecord(candidate.data);
  }

  if ('admin' in candidate) {
    return readAdminRecord(candidate.admin);
  }

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
  } else if (formData.contrasenaActual.trim()) {
    payload.contrasena = formData.contrasenaActual.trim();
  }

  return payload;
};

function Admins() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminRecord | null>(null);
  const [formData, setFormData] = useState<AdminFormState>(createInitialFormData());

  useEffect(() => {
    void cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    try {
      setLoading(true);
      const response = await obtenerAdmins();
      setAdmins(extractAdmins(response.data));
    } catch (error) {
      console.error('Error al obtener admins:', error);
      setAdmins([]);
      alert('No se pudieron cargar los administradores.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setFormData(previousData => ({
      ...previousData,
      [name]: value,
    }));
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
        alert('La contrasena es obligatoria para crear un administrador.');
        return;
      }

      const response = await crearAdmin(payload);

      if (isSuccessfulResponse(response.data)) {
        await Swal.fire({
          title: 'Administrador creado',
          text: 'El nuevo administrador fue registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
        closeCreateModal();
        await cargarAdmins();
      } else {
        alert('No se pudo crear el administrador');
      }
    } catch (error) {
      console.error('Error al crear administrador:', error);
      alert('Ocurrio un error al crear el administrador.');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentAdmin) {
      return;
    }

    try {
      const payload = buildAdminPayload(formData);

      if (!payload.contrasena) {
        alert('Ingresa una contraseña o carga primero la contraseña actual antes de guardar.');
        return;
      }

      const response = await actualizarAdmin(currentAdmin.ID_ADMINISTRADOR, payload);

      if (isSuccessfulResponse(response.data)) {
        await Swal.fire({
          title: 'Cambios guardados',
          text: 'El administrador fue actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5',
        });
        closeEditModal();
        await cargarAdmins();
      } else {
        alert('No se pudo actualizar el administrador');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Ocurrio un error al actualizar el administrador.');
    }
  };

  const borrarAdmin = async (admin: AdminRecord) => {
    if (!window.confirm(`Estas seguro de eliminar a ${admin.Nombre}?`)) {
      return;
    }

    try {
      await eliminarAdmin(admin.ID_ADMINISTRADOR);
      setAdmins(previousAdmins =>
        previousAdmins.filter(item => item.ID_ADMINISTRADOR !== admin.ID_ADMINISTRADOR)
      );
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Ocurrio un error al eliminar el administrador.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section">
        <h1 className="admin-title">Panel de Administracion</h1>
        <div className="action-bar">
          <button className="btn-create" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Nuevo Administrador
          </button>
        </div>

        <table className="table-ktm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Documento</th>
              <th>Telefono</th>
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
            ) : admins.length > 0 ? (
              admins.map(admin => (
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

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-container" onClick={event => event.stopPropagation()}>
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
                <label>Telefono</label>
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
                <label>Contrasena</label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  placeholder="Ingresa la contrasena del administrador"
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

      {showEditModal && currentAdmin && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={event => event.stopPropagation()}>
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
                <label>Telefono</label>
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
                <label>Nueva contrasena</label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  placeholder="Dejala vacia para mantener la actual"
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
