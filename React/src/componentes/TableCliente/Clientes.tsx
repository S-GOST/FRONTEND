import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  insertarCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerClientePorId,
  obtenerClientes,
  type ClientePayload,
  type ClienteRecord,
} from '../../services/cliente.service';
import { obtenerTiposDocumento, type TipoDocumentoRecord } from '../../services/tipoDocumento.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Cliente.css';

type ClienteFormState = ClientePayload & {
  password: string;
  passwordActual: string;
};

const createInitialFormData = (): ClienteFormState => ({
  numero_documento: '',
  nombre: '',
  correo: '',
  ciudad: '',
  id_tipo_documento: '',
  telefono: '',
  usuario: '',
  password: '',
  passwordActual: '',
});

// --- FUNCIONES AUXILIARES DE VALIDACIÓN ---
const filterOnlyLetters = (value: string): string => value.replace(/[^a-zA-ZñÑ\s]/g, '');
const filterOnlyNumbers = (value: string): string => value.replace(/\D/g, '');

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
  if ('numero_documento' in candidate)
    return candidate as unknown as ClienteRecord;
  if ('data' in candidate) return readClienteRecord(candidate.data);
  if ('cliente' in candidate) return readClienteRecord(candidate.cliente);
  return null;
};

const buildClientePayload = (formData: ClienteFormState): ClientePayload => {
  const payload: ClientePayload = {
    numero_documento: String(formData.numero_documento).trim(),
    nombre: formData.nombre.trim(),
    correo: formData.correo.trim(),
    ciudad: formData.ciudad.trim(),
    id_tipo_documento: formData.id_tipo_documento,
    telefono: formData.telefono.trim(),
    usuario: formData.usuario.trim(),
  };
  if (formData.password.trim()) {
    payload.password = formData.password.trim();
  }
  return payload;
};

function Clientes() {
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoRecord[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<ClienteRecord | null>(null);
  const [formData, setFormData] = useState<ClienteFormState>(createInitialFormData());

  useEffect(() => {
    void cargarTipos();
    void cargarClientes();
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
      cliente.nombre.toLowerCase().includes(term) ||
      cliente.correo.toLowerCase().includes(term) ||
      cliente.usuario.toLowerCase().includes(term) ||
      String(cliente.numero_documento).toLowerCase().includes(term)
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

  // ✅ MANEJADOR: SOLO LETRAS (Nombre y Usuario)
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

  // ✅ MANEJADOR: SOLO NÚMEROS (ID Cliente)
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

  const openEditModal = async (cliente: ClienteRecord) => {
    const originalId = String(cliente.numero_documento ?? '').trim();
    if (!originalId) {
      setCurrentCliente(cliente);
      setFormData({
        numero_documento: cliente.numero_documento,
        nombre: cliente.nombre,
        correo: cliente.correo,
        ciudad: cliente.ciudad,
        id_tipo_documento: cliente.id_tipo_documento,
        telefono: cliente.telefono,
        usuario: cliente.usuario,
        password: '',
        passwordActual: cliente.password ?? '',
      });
      setShowEditModal(true);
      return;
    }
    try {
      const response = await obtenerClientePorId(originalId);
      const clienteActualizado = readClienteRecord(response.data) ?? cliente;
      setCurrentCliente(clienteActualizado);
      setFormData({
        numero_documento: clienteActualizado.numero_documento,
        nombre: clienteActualizado.nombre,
        correo: clienteActualizado.correo,
        ciudad: clienteActualizado.ciudad,
        id_tipo_documento: clienteActualizado.id_tipo_documento,
        telefono: clienteActualizado.telefono,
        usuario: clienteActualizado.usuario,
        password: '',
        passwordActual: clienteActualizado.password ?? '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar cliente para editar:', error);
      setCurrentCliente(cliente);
      setFormData({
        numero_documento: cliente.numero_documento,
        nombre: cliente.nombre,
        correo: cliente.correo,
        ciudad: cliente.ciudad,
        id_tipo_documento: cliente.id_tipo_documento,
        telefono: cliente.telefono,
        usuario: cliente.usuario,
        password: '',
        passwordActual: cliente.password ?? '',
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
      if (!payload.password) {
        showAlert('Atención', 'La contraseña es obligatoria para crear un cliente.', 'warning');
        return;
      }
      const response = await insertarCliente(payload);
      if (isSuccessfulResponse(response.data)) {
        await showAlert('Cliente creado', 'El nuevo cliente fue registrado correctamente.', 'success');
        closeCreateModal();
        await cargarClientes();
      } else {
        showAlert('Error', 'No se pudo crear el cliente.', 'error');
      }
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      const msg = error.response?.data?.message || error.message;
      if (msg.includes('Duplicate entry') || error.response?.status === 409) {
        showAlert('Error', 'Ya existe un cliente con ese ID, correo o usuario. Verifica los datos.', 'warning');
      } else {
        showAlert('Error', 'Ocurrió un error al crear el cliente.', 'error');
      }
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentCliente) return;
    try {
      const payload = buildClientePayload(formData);
      if (!payload.password) {
        showAlert('Atención', 'Ingresa una contraseña o carga primero la contraseña actual antes de guardar.', 'warning');
        return;
      }
      const response = await actualizarCliente(currentCliente.numero_documento, payload);
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
      title: `¿Estás seguro de eliminar a ${cliente.nombre}?`,
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
      await eliminarCliente(cliente.numero_documento);
      setClientes(prev => prev.filter(item => item.numero_documento !== cliente.numero_documento));
      setFilteredClientes(prev => prev.filter(item => item.numero_documento !== cliente.numero_documento));
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
                  <tr key={cliente.numero_documento}>
                    <td><FormattedId entity="cliente" value={cliente.numero_documento} /></td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.correo}</td>
                    <td>{tiposDocumento.find(t => String(t.id_tipo_documento) === String(cliente.id_tipo_documento))?.nombre || cliente.id_tipo_documento}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.ciudad}</td>
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
                <label>Documento Cliente</label>
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
                <label>Ubicación</label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
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
                <label>Documento Cliente</label>
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
                <label>Ubicación</label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
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