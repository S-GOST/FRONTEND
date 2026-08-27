import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  obtenerAdmins,
  insertarAdmin,
  actualizarAdmin,
  eliminarAdmin,
  habilitarAdmin,
  type AdminRecord,
  type AdministradorPayload as AdminPayload,
} from '../../services/admin.service';
import {
  obtenerTecnicos,
  insertarTecnico,
  actualizarTecnico,
  eliminarTecnico,
  habilitarTecnico,
  type TecnicoRecord,
  type TecnicoPayload,
} from '../../services/tecnico.service';
import {
  obtenerClientes,
  insertarCliente,
  actualizarCliente,
  eliminarCliente,
  habilitarCliente,
  obtenerClientesPendientes,
  procesarAprobacionCliente,
  type ClienteRecord,
  type ClientePayload,
} from '../../services/cliente.service';
import {
  obtenerTiposDocumento,
  type TipoDocumentoRecord,
} from '../../services/tipoDocumento.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Admin.css';

const TAB_KEYS = ['admins', 'tecnicos', 'clientes', 'pendientes'] as const;

type UserTab = (typeof TAB_KEYS)[number];

type UserFormData = {
  numero_documento: string;
  id_tipo_documento: string;
  nombre: string;
  correo: string;
  telefono: string;
  usuario: string;
  password: string;
  ciudad?: string;
};

const createInitialFormData = (): UserFormData => ({
  numero_documento: '',
  id_tipo_documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  usuario: '',
  password: '',
  ciudad: '',
});

const getTabLabel = (tab: UserTab) => {
  switch (tab) {
    case 'admins': return 'Administradores';
    case 'tecnicos': return 'Técnicos';
    case 'clientes': return 'Clientes';
    case 'pendientes': return 'Pendientes';
    default: return 'Usuarios';
  }
};

const formatTipoDocumento = (tipos: TipoDocumentoRecord[], id: string | number) => {
  return tipos.find(t => String(t.id_tipo_documento) === String(id))?.nombre || String(id);
};

const extractArray = <T,>(payload: unknown, alias?: string): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const objectPayload = payload as Record<string, unknown>;
  if (alias && Array.isArray(objectPayload[alias])) return objectPayload[alias] as T[];
  if (Array.isArray(objectPayload.data)) return objectPayload.data as T[];
  if (Array.isArray(objectPayload.admins)) return objectPayload.admins as T[];
  if (Array.isArray(objectPayload.tecnicos)) return objectPayload.tecnicos as T[];
  if (Array.isArray(objectPayload.clientes)) return objectPayload.clientes as T[];

  for (const key in objectPayload) {
    const value = objectPayload[key];
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') {
      const result = extractArray<T>(value, alias);
      if (result.length) return result;
    }
  }

  return [];
};

const filterUsers = <T extends { nombre?: string; correo?: string; usuario?: string; numero_documento?: string | number }>(
  items: T[],
  term: string,
) => {
  const normalized = term.toLowerCase().trim();
  if (!normalized) return items;

  return items.filter(item =>
    String(item.nombre ?? '').toLowerCase().includes(normalized) ||
    String(item.correo ?? '').toLowerCase().includes(normalized) ||
    String(item.usuario ?? '').toLowerCase().includes(normalized) ||
    String(item.numero_documento ?? '').toLowerCase().includes(normalized),
  );
};

const buildPayload = (tab: UserTab, formData: UserFormData): AdminPayload | TecnicoPayload | ClientePayload => {
  const commonPayload = {
    numero_documento: String(formData.numero_documento).trim(),
    nombre: formData.nombre.trim(),
    correo: formData.correo.trim(),
    id_tipo_documento: formData.id_tipo_documento,
    telefono: formData.telefono.trim(),
    usuario: formData.usuario.trim(),
    ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
  };

  if (tab === 'clientes') {
    const payload = {
      ...commonPayload,
      ciudad: formData.ciudad?.trim() || '',
    };
    console.debug('Usuarios buildPayload', { tab, payload });
    return payload;
  }

  const payload = { ...commonPayload };
  console.debug('Usuarios buildPayload', { tab, payload });
  return payload;
};

const resolveTabFromPath = (pathname: string): UserTab => {
  const segments = pathname.split('/').filter(Boolean);
  const section = segments[1] || 'usuarios';

  if (section === 'tecnicos') return 'tecnicos';
  if (section === 'clientes') return 'clientes';
  if (section === 'pendientes') return 'pendientes';
  return 'admins';
};

function Usuarios() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>(() => resolveTabFromPath(location.pathname));
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [clientesPendientes, setClientesPendientes] = useState<ClienteRecord[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminRecord[]>([]);
  const [filteredTecnicos, setFilteredTecnicos] = useState<TecnicoRecord[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteRecord[]>([]);
  const [filteredPendientes, setFilteredPendientes] = useState<ClienteRecord[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AdminRecord | TecnicoRecord | ClienteRecord | null>(null);
  const [formData, setFormData] = useState<UserFormData>(createInitialFormData());

  useEffect(() => {
    void cargarDatos();
  }, []);

  useEffect(() => {
    const tab = resolveTabFromPath(location.pathname);
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname, activeTab]);

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

  const handleApiError = (error: unknown, fallbackMessage: string) => {
    const axiosError = error as { response?: { status?: number; data?: any } };
    const status = axiosError?.response?.status;
    const data = axiosError?.response?.data;
    
    let serverMessage = data?.message || data?.error || data?.msg || JSON.stringify(data || '');

    // Extraer array de errores de validación si existe (express-validator)
    if (data?.errores && Array.isArray(data.errores)) {
      const errorDetails = data.errores.map((err: any) => `- ${err.mensaje}`).join('\n');
      serverMessage = `${serverMessage}:\n${errorDetails}`;
    }

    if (status === 401 || status === 403) {
      localStorage.clear();
      window.location.replace('/login');
      return;
    }

    console.error(fallbackMessage, error);
    showAlert('Error', serverMessage || fallbackMessage, 'error');
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [adminsRes, tecnicosRes, clientesRes, pendientesRes, tiposRes] = await Promise.all([
        obtenerAdmins(),
        obtenerTecnicos(),
        obtenerClientes(),
        obtenerClientesPendientes(),
        obtenerTiposDocumento(),
      ]);

      const adminData = extractArray<AdminRecord>(adminsRes.data, 'admins');
      const tecnicoData = extractArray<TecnicoRecord>(tecnicosRes.data, 'tecnicos');
      const clienteData = extractArray<ClienteRecord>(clientesRes.data, 'clientes');
      const pendientesData = extractArray<ClienteRecord>(pendientesRes.data, 'data');
      const tipos = extractArray<TipoDocumentoRecord>(tiposRes.data);

      setAdmins(adminData);
      setTecnicos(tecnicoData);
      setClientes(clienteData);
      setClientesPendientes(pendientesData);
      setFilteredAdmins(adminData);
      setFilteredTecnicos(tecnicoData);
      setFilteredClientes(clienteData);
      setFilteredPendientes(pendientesData);
      setTiposDocumento(tipos);
    } catch (error) {
      handleApiError(error, 'No se pudieron cargar los usuarios.');
      setAdmins([]);
      setTecnicos([]);
      setClientes([]);
      setClientesPendientes([]);
      setFilteredAdmins([]);
      setFilteredTecnicos([]);
      setFilteredClientes([]);
      setFilteredPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: UserTab) => {
    const route = tab === 'admins' ? '/admin/usuarios' : `/admin/${tab}`;
    navigate(route);
    setSearchTerm('');
    setActiveTab(tab);
    if (tab === 'admins') setFilteredAdmins(admins);
    if (tab === 'tecnicos') setFilteredTecnicos(tecnicos);
    if (tab === 'clientes') setFilteredClientes(clientes);
    if (tab === 'pendientes') setFilteredPendientes(clientesPendientes);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredAdmins(admins);
      setFilteredTecnicos(tecnicos);
      setFilteredClientes(clientes);
      setFilteredPendientes(clientesPendientes);
      return;
    }

    setFilteredAdmins(filterUsers(admins, searchTerm));
    setFilteredTecnicos(filterUsers(tecnicos, searchTerm));
    setFilteredClientes(filterUsers(clientes, searchTerm));
    setFilteredPendientes(filterUsers(clientesPendientes, searchTerm));
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setCurrentRecord(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (record: AdminRecord | TecnicoRecord | ClienteRecord) => {
    setCurrentRecord(record);
    setFormData({
      numero_documento: String(record.numero_documento ?? ''),
      id_tipo_documento: String(record.id_tipo_documento ?? ''),
      nombre: String(record.nombre ?? ''),
      correo: String(record.correo ?? ''),
      telefono: String(record.telefono ?? ''),
      usuario: String(record.usuario ?? ''),
      password: '',
      ciudad: 'ciudad' in record ? String((record as ClienteRecord).ciudad ?? '') : '',
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(activeTab, formData);
    if (!payload.password) {
      showAlert('Atención', 'La contraseña es obligatoria para crear un usuario.', 'warning');
      return;
    }

    console.debug('Usuarios:create payload', { activeTab, payload });

    try {
      if (activeTab === 'admins') await insertarAdmin(payload as AdminPayload);
      if (activeTab === 'tecnicos') await insertarTecnico(payload as TecnicoPayload);
      if (activeTab === 'clientes') await insertarCliente(payload as ClientePayload);

      await showAlert('Creado', `${getTabLabel(activeTab).slice(0, -1)} creado correctamente.`, 'success');
      closeCreateModal();
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al crear el usuario.');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentRecord) return;

    const payload = buildPayload(activeTab, formData);
    const originalId = String(currentRecord.numero_documento ?? '').trim();
    if (!originalId) {
      showAlert('Error', 'ID inválido para actualizar.', 'error');
      return;
    }

    console.debug('Usuarios:update payload', { activeTab, originalId, payload });

    try {
      if (activeTab === 'admins') await actualizarAdmin(originalId, payload as AdminPayload);
      if (activeTab === 'tecnicos') await actualizarTecnico(originalId, payload as TecnicoPayload);
      if (activeTab === 'clientes') await actualizarCliente(originalId, payload as ClientePayload);

      await showAlert('Actualizado', `${getTabLabel(activeTab).slice(0, -1)} actualizado correctamente.`, 'success');
      closeEditModal();
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al actualizar el usuario.');
    }
  };

  const handleDelete = async (record: AdminRecord | TecnicoRecord | ClienteRecord) => {
    const result = await Swal.fire({
      title: `¿Inhabilitar ${record.nombre}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#a51f1f',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Sí, inhabilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      if (activeTab === 'admins') await eliminarAdmin(record.numero_documento);
      if (activeTab === 'tecnicos') await eliminarTecnico(record.numero_documento);
      if (activeTab === 'clientes') await eliminarCliente(record.numero_documento);
      await showAlert('Inhabilitado', `${getTabLabel(activeTab).slice(0, -1)} inhabilitado correctamente.`, 'success');
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al inhabilitar el usuario.');
    }
  };

  const handleEnable = async (record: AdminRecord | TecnicoRecord | ClienteRecord) => {
    const result = await Swal.fire({
      title: `¿Habilitar a ${record.nombre}?`,
      text: 'El usuario podrá acceder nuevamente al sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Sí, habilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      if (activeTab === 'admins') await habilitarAdmin(record.numero_documento);
      if (activeTab === 'tecnicos') await habilitarTecnico(record.numero_documento);
      if (activeTab === 'clientes') await habilitarCliente(record.numero_documento);
      await showAlert('Habilitado', `${getTabLabel(activeTab).slice(0, -1)} habilitado correctamente.`, 'success');
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al habilitar el usuario.');
    }
  };

  const handleAprobar = async (record: ClienteRecord) => {
    const result = await Swal.fire({
      title: `¿Aprobar a ${record.nombre}?`,
      text: 'El cliente será notificado por correo electrónico.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      await procesarAprobacionCliente(record.numero_documento, 'Aprobar');
      await showAlert('Aprobado', `Cliente aprobado exitosamente. Se ha notificado al cliente.`, 'success');
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al aprobar el cliente.');
    }
  };

  const handleRechazar = async (record: ClienteRecord) => {
    const result = await Swal.fire({
      title: `¿Rechazar a ${record.nombre}?`,
      text: 'Ingresa la justificación (obligatoria):',
      input: 'textarea',
      inputPlaceholder: 'Ej. Documento no válido...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Rechazar cliente',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
      preConfirm: (justificacion) => {
        if (!justificacion || justificacion.trim() === '') {
          Swal.showValidationMessage('Se requiere justificación para rechazar un cliente.');
          return false;
        }
        return justificacion;
      }
    });

    if (!result.isConfirmed) return;

    try {
      await procesarAprobacionCliente(record.numero_documento, 'Rechazar', result.value);
      await showAlert('Rechazado', `Cliente rechazado exitosamente. Se ha notificado al cliente.`, 'success');
      await cargarDatos();
    } catch (error) {
      handleApiError(error, 'Ocurrió un error al rechazar el cliente.');
    }
  };

  const currentItems = activeTab === 'admins' ? filteredAdmins : activeTab === 'tecnicos' ? filteredTecnicos : activeTab === 'pendientes' ? filteredPendientes : filteredClientes;

  return (
    <div className="admin-page">
      <div className="admin-section">
        <div className="header-with-back" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="btn-back-dashboard"
            title="Volver al Dashboard"
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '1.2rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#ff6600';
              e.currentTarget.style.borderColor = '#ff6600';
              e.currentTarget.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#1a1a1a';
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Usuarios</h1>
        </div>

        <div className="user-summary-cards">
          <div className="summary-card admin-card">
            <span>Administradores</span>
            <strong>{admins.length}</strong>
          </div>
          <div className="summary-card tecnico-card">
            <span>Técnicos</span>
            <strong>{tecnicos.length}</strong>
          </div>
          <div className="summary-card cliente-card">
            <span>Clientes</span>
            <strong>{clientes.length}</strong>
          </div>
          <div className="summary-card pendiente-card" style={{ borderColor: '#ef4444' }}>
            <span>Pendientes</span>
            <strong>{clientesPendientes.length}</strong>
          </div>
        </div>

        <div className="tabs-row">
          {TAB_KEYS.map(tab => (
            <button
              type="button"
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder={`Buscar en ${getTabLabel(activeTab)}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} title="Buscar">
              <i className="bi bi-search"></i>
            </button>
          </div>
          {(activeTab !== 'clientes' && activeTab !== 'pendientes') && (
            <div className="right-actions">
              <button className="btn-create" onClick={openCreateModal}>
                <i className="bi bi-plus-circle"></i> Nuevo {getTabLabel(activeTab).slice(0, -1)}
              </button>
            </div>
          )}
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
                {(activeTab === 'clientes' || activeTab === 'pendientes') && <th>Ciudad</th>}
                <th>Usuario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={(activeTab === 'clientes' || activeTab === 'pendientes') ? 10 : 9} className="loading-row">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map(item => (
                  <tr key={item.numero_documento} style={{ opacity: ((item as any).estado === 0 || (item as any).estado === '0' || String((item as any).estado ?? (item as any).Estado).toLowerCase() === 'inactivo') ? 0.5 : 1 }}>
                    <td><FormattedId entity={activeTab === 'admins' ? 'admin' : activeTab === 'tecnicos' ? 'tecnico' : 'cliente'} value={item.numero_documento} /></td>
                    <td>{item.nombre}</td>
                    <td>{item.correo}</td>
                    <td>{formatTipoDocumento(tiposDocumento, item.id_tipo_documento)}</td>
                    <td>{item.telefono}</td>
                    {(activeTab === 'clientes' || activeTab === 'pendientes') && <td>{(item as ClienteRecord).ciudad}</td>}
                    <td>{item.usuario}</td>
                    <td>
                      {(() => {
                        const est = (item as any).estado ?? (item as any).Estado;
                        if (est === 'Pendiente') return <span style={{ background: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pendiente</span>;
                        if (est === 'Rechazado') return <span style={{ background: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Rechazado</span>;
                        if (est === undefined || est === null) return <span style={{ background: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Activo</span>;
                        const isInactive = est === 0 || est === '0' || String(est).toLowerCase() === 'inactivo' || est === false;
                        return <span style={{ background: isInactive ? '#ef4444' : '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{isInactive ? 'Inactivo' : 'Activo'}</span>;
                      })()}
                    </td>
                    <td className="actions-cell">
                      {activeTab === 'pendientes' ? (
                        <>
                          <button className="btn-edit-ktm" style={{ background: '#064e3b', borderColor: '#10b981', marginRight: '5px' }} onClick={() => handleAprobar(item as ClienteRecord)}>
                            <i className="bi bi-check-circle"></i> Aprobar
                          </button>
                          <button className="btn-eliminar-ktm" onClick={() => handleRechazar(item as ClienteRecord)}>
                            <i className="bi bi-x-circle"></i> Rechazar
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-edit-ktm" onClick={() => openEditModal(item)}>
                            <i className="bi bi-pencil-square"></i> Editar
                          </button>
                          {((item as any).estado === 0 || (item as any).estado === '0' || String((item as any).estado ?? (item as any).Estado).toLowerCase() === 'inactivo' || String((item as any).estado ?? (item as any).Estado).toLowerCase() === 'rechazado') ? (
                            <button className="btn-edit-ktm" style={{ background: '#064e3b', borderColor: '#10b981' }} onClick={() => handleEnable(item)}>
                              <i className="bi bi-check-circle"></i> Habilitar
                            </button>
                          ) : (
                            <button className="btn-eliminar-ktm" onClick={() => handleDelete(item)}>
                              <i className="bi bi-person-x"></i> Inhabilitar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(activeTab === 'clientes' || activeTab === 'pendientes') ? 10 : 9} className="loading-row">
                    No se encontraron resultados para {getTabLabel(activeTab).toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showCreateModal ? `Crear ${getTabLabel(activeTab).slice(0, -1)}` : `Editar ${getTabLabel(activeTab).slice(0, -1)}`}</h3>
              <button type="button" className="close-btn" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <div className="form-group">
                <label>Documento</label>
                <input
                  type="text"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (/\d/.test(e.key)) e.preventDefault(); }}
                  pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$"
                  title="El nombre solo debe contener letras"
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
              {activeTab === 'clientes' && (
                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
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
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{showCreateModal ? 'Contraseña' : 'Nueva contraseña'}</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={showCreateModal ? 'Ingresa la contraseña' : 'Dejar en blanco para mantener la actual'}
                    {...(showCreateModal ? { required: true } : {})}
                    style={{ flex: 1, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#ff6b00',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">{showCreateModal ? 'Guardar' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
