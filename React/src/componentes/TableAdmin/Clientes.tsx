import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerClientePorId,
  obtenerClientes,
  type ClientePayload,
  type ClienteRecord,
} from '../../services/clientesService';
import './Admin.css';

type ClienteFormState = ClientePayload & {
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

const createInitialFormData = (): ClienteFormState => ({
  ID_CLIENTES: '',
  Nombre: '',
  Correo: '',
  Ubicacion: '',
  TipoDocumento: '',
  Telefono: '',
  usuario: '',
  contrasena: '',
  contrasenaActual: '',
});

const readClienteArray = (value: unknown): ClienteRecord[] | null => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    const fromData = readClienteArray(nested.data);
    if (fromData) return fromData;
    const fromClientes = readClienteArray(nested.clientes);
    if (fromClientes) return fromClientes;
  }
  return null;
};

const extractClientes = (payload: unknown): ClienteRecord[] =>
  readClienteArray(payload) ?? [];

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload))
    return true;
  return Boolean((payload as { success?: boolean }).success);
};

const readClienteRecord = (value: unknown): ClienteRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if ('ID_CLIENTES' in candidate)
    return candidate as unknown as ClienteRecord;
  if ('data' in candidate) return readClienteRecord(candidate.data);
  if ('cliente' in candidate) return readClienteRecord(candidate.cliente);
  return null;
};

const buildClientePayload = (formData: ClienteFormState): ClientePayload => {
  const payload: ClientePayload = {
    ID_CLIENTES: String(formData.ID_CLIENTES).trim(),
    Nombre: formData.Nombre.trim(),
    Correo: formData.Correo.trim(),
    Ubicacion: formData.Ubicacion.trim(),
    TipoDocumento: formData.TipoDocumento,
    Telefono: formData.Telefono.trim(),
    usuario: formData.usuario.trim(),
  };
  if (formData.contrasena.trim()) {
    payload.contrasena = formData.contrasena.trim();
  }

  return payload;
};

function Clientes() {
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<ClienteRecord | null>(null);
  const [formData, setFormData] = useState<ClienteFormState>(createInitialFormData());

  useEffect(() => {
    void cargarClientes();
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

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await obtenerClientes();
      const data = extractClientes(response.data);
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      setClientes([]);
      setFilteredClientes([]);
      showAlert('Error', 'No se pudieron cargar los clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredClientes(clientes);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = clientes.filter(cliente =>
      cliente.Nombre.toLowerCase().includes(term) ||
      cliente.Correo.toLowerCase().includes(term) ||
      cliente.usuario.toLowerCase().includes(term) ||
      String(cliente.ID_CLIENTES).toLowerCase().includes(term)
    );
    setFilteredClientes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredClientes(clientes);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = async (cliente: ClienteRecord) => {
    const originalId = String(cliente.ID_CLIENTES ?? '').trim();
    if (!originalId) {
      setCurrentCliente(cliente);
      setFormData({
        ID_CLIENTES: cliente.ID_CLIENTES,
        Nombre: cliente.Nombre,
        Correo: cliente.Correo,
        Ubicacion: cliente.Ubicacion,
        TipoDocumento: cliente.TipoDocumento,
        Telefono: cliente.Telefono,
        usuario: cliente.usuario,
        contrasena: '',
        contrasenaActual: cliente.contrasena ?? '',
      });
      setShowEditModal(true);
      return;
    }
    try {
      const response = await obtenerClientePorId(originalId);
      const clienteActualizado = readClienteRecord(response.data) ?? cliente;
      setCurrentCliente(clienteActualizado);
      setFormData({
        ID_CLIENTES: clienteActualizado.ID_CLIENTES,
        Nombre: clienteActualizado.Nombre,
        Correo: clienteActualizado.Correo,
        Ubicacion: clienteActualizado.Ubicacion,
        TipoDocumento: clienteActualizado.TipoDocumento,
        Telefono: clienteActualizado.Telefono,
        usuario: clienteActualizado.usuario,
        contrasena: '',
        contrasenaActual: clienteActualizado.contrasena ?? '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar cliente para editar:', error);
      setCurrentCliente(cliente);
      setFormData({
        ID_CLIENTES: cliente.ID_CLIENTES,
        Nombre: cliente.Nombre,
        Correo: cliente.Correo,
        Ubicacion: cliente.Ubicacion,
        TipoDocumento: cliente.TipoDocumento,
        Telefono: cliente.Telefono,
        usuario: cliente.usuario,
        contrasena: '',
        contrasenaActual: cliente.contrasena ?? '',
      });
      setShowEditModal(true);
    }
  };

  const openCreateModal = () => {
    setCurrentCliente(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentCliente(null);
    setFormData(createInitialFormData());
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = buildClientePayload(formData);
      if (!payload.contrasena) {
        showAlert('Atención', 'La contraseña es obligatoria para crear un cliente.', 'warning');
        return;
      }
      const response = await crearCliente(payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Cliente creado', 'El nuevo cliente fue registrado correctamente.', 'success');
        closeCreateModal();
        await cargarClientes();
      } else {
        showAlert('Error', 'No se pudo crear el cliente.', 'error');
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      showAlert('Error', 'Ocurrió un error al crear el cliente.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentCliente) return;
    try {
      const payload = buildClientePayload(formData);
      if (!payload.contrasena) {
        showAlert('Atención', 'Ingresa una contraseña o carga primero la contraseña actual antes de guardar.', 'warning');
        return;
      }
      const response = await actualizarCliente(currentCliente.ID_CLIENTES, payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Cambios guardados', 'El cliente fue actualizado correctamente.', 'success');
        closeEditModal();
        await cargarClientes();
      } else {
        showAlert('Error', 'No se pudo actualizar el cliente.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      showAlert('Error', 'Ocurrió un error al actualizar el cliente.', 'error');
    }
  };

  const borrarCliente = async (cliente: ClienteRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar a ${cliente.Nombre}?`,
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
      await eliminarCliente(cliente.ID_CLIENTES);
      setClientes(prev => prev.filter(item => item.ID_CLIENTES !== cliente.ID_CLIENTES));
      setFilteredClientes(prev => prev.filter(item => item.ID_CLIENTES !== cliente.ID_CLIENTES));
      Swal.fire({
        title: 'Eliminado',
        text: 'El cliente ha sido eliminado.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      showAlert('Error', 'Ocurrió un error al eliminar el cliente.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section">
        <h1 className="admin-title">Gestión de Clientes</h1>
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
              <i className="bi bi-plus-circle"></i> Nuevo Cliente
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
                <th>Ubicación</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-row">
                    Cargando datos...
                  </td>
                </tr>
              ) : filteredClientes.length > 0 ? (
                filteredClientes.map(cliente => (
                  <tr key={cliente.ID_CLIENTES}>
                    <td>{cliente.ID_CLIENTES}</td>
                    <td>{cliente.Nombre}</td>
                    <td>{cliente.Correo}</td>
                    <td>{cliente.TipoDocumento}</td>
                    <td>{cliente.Telefono}</td>
                    <td>{cliente.Ubicacion}</td>
                    <td>{cliente.usuario}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(cliente)}
                        title="Editar Cliente"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button
                        className="btn-eliminar-ktm"
                        onClick={() => borrarCliente(cliente)}
                        title="Eliminar Cliente"
                      >
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="loading-row">
                    No hay clientes registrados.
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
              <h3>Crear Cliente</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>ID Cliente</label>
                <input
                  type="text"
                  name="ID_CLIENTES"
                  value={formData.ID_CLIENTES}
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
                <label>Ubicación</label>
                <input
                  type="text"
                  name="Ubicacion"
                  value={formData.Ubicacion}
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
                  placeholder="Ingresa la contraseña del cliente"
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
      {showEditModal && currentCliente && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>ID Cliente</label>
                <input
                  type="text"
                  name="ID_CLIENTES"
                  value={formData.ID_CLIENTES}
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
                <label>Ubicación</label>
                <input
                  type="text"
                  name="Ubicacion"
                  value={formData.Ubicacion}
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
                  placeholder="Dejar en blanco para no cambiar"
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

export default Clientes;
