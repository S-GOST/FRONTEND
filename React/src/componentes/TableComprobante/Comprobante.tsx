// src/components/TableComprobantes/Comprobante.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerComprobantes,
  crearComprobante,
  actualizarComprobante,
  eliminarComprobante,
  type ComprobantePayload,
  type ComprobanteRecord,
} from '../../services/comprobanteService';
import { obtenerInformes, type InformeRecord } from '../../services/informeService';
import { obtenerClientes, type ClienteRecord } from '../../services/clientesService';
import { obtenerAdmins, type AdminRecord } from '../../services/adminService';
import './Comprobante.css';

// Helper para extraer arrays anidados
const extractArray = <T,>(payload: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return fallback;
};

const createInitialFormData = (): ComprobantePayload => ({
  ID_COMPROBANTE: '',
  ID_INFORME: '',
  ID_CLIENTES: '',
  ID_ADMINISTRADOR: '',
  Monto: 0,
  Fecha: new Date().toISOString().split('T')[0],
  Estado_pago: 'Pendiente',
});

const buildComprobantePayload = (formData: ComprobantePayload): ComprobantePayload => {
  const id = String(formData.ID_COMPROBANTE ?? '').trim();
  if (!id) throw new Error('El ID del comprobante es obligatorio.');
  if (!formData.ID_CLIENTES) throw new Error('El ID del cliente es obligatorio.');
  const monto = typeof formData.Monto === 'string' ? parseFloat(formData.Monto) : formData.Monto;
  if (isNaN(monto) || monto < 0) {
    throw new Error('El monto debe ser un número válido mayor o igual a 0.');
  }
  if (!formData.Fecha) throw new Error('La fecha es obligatoria.');

  return {
    ID_COMPROBANTE: id,
    ID_INFORME: formData.ID_INFORME?.trim() || null,
    ID_CLIENTES: String(formData.ID_CLIENTES).trim(),
    ID_ADMINISTRADOR: formData.ID_ADMINISTRADOR?.trim() || null,
    Monto: monto,
    Fecha: formData.Fecha,
    Estado_pago: formData.Estado_pago,
  };
};

const extractComprobantes = (payload: unknown): ComprobanteRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.comprobantes)) return obj.comprobantes;
  }
  return [];
};

const isSuccessResponse = (response: unknown): boolean => {
  if (response && typeof response === 'object' && 'success' in response) {
    return (response as { success?: boolean }).success === true;
  }
  return true;
};

const formatMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

function TableComprobantes() {
  const [comprobantes, setComprobantes] = useState<ComprobanteRecord[]>([]);
  const [filteredComprobantes, setFilteredComprobantes] = useState<ComprobanteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentComprobante, setCurrentComprobante] = useState<ComprobanteRecord | null>(null);
  const [formData, setFormData] = useState<ComprobantePayload>(createInitialFormData());

  const [informes, setInformes] = useState<InformeRecord[]>([]);
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [administradores, setAdministradores] = useState<AdminRecord[]>([]);

  useEffect(() => {
    void cargarDatosIniciales();
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

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [comprobantesRes, informesRes, clientesRes, adminsRes] = await Promise.all([
        obtenerComprobantes(),
        obtenerInformes(),
        obtenerClientes(),
        obtenerAdmins(),
      ]);
      setComprobantes(extractComprobantes(comprobantesRes.data));
      setFilteredComprobantes(extractComprobantes(comprobantesRes.data));
      setInformes(extractArray(informesRes.data, []));
      setClientes(extractArray(clientesRes.data, []));
      setAdministradores(extractArray(adminsRes.data, []));
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredComprobantes(comprobantes);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = comprobantes.filter(c => {
      const id = String(c.ID_COMPROBANTE).toLowerCase();
      const cliente = c.ID_CLIENTES ? String(c.ID_CLIENTES).toLowerCase() : '';
      const estado = c.Estado_pago.toLowerCase();
      return id.includes(term) || cliente.includes(term) || estado.includes(term);
    });
    setFilteredComprobantes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredComprobantes(comprobantes);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setCurrentComprobante(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (comp: ComprobanteRecord) => {
    setCurrentComprobante(comp);
    setFormData({
      ID_COMPROBANTE: comp.ID_COMPROBANTE,
      ID_INFORME: comp.ID_INFORME || '',
      ID_CLIENTES: comp.ID_CLIENTES,
      ID_ADMINISTRADOR: comp.ID_ADMINISTRADOR || '',
      Monto: comp.Monto,
      Fecha: comp.Fecha.split('T')[0],
      Estado_pago: comp.Estado_pago,
    });
    setShowEditModal(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = buildComprobantePayload(formData);
      const response = await crearComprobante(payload);
      if (isSuccessResponse(response.data)) {
        showAlert('Éxito', 'Comprobante registrado correctamente.', 'success');
        setShowCreateModal(false);
        await cargarDatosIniciales();
      } else {
        showAlert('Error', 'No se pudo crear el comprobante.', 'error');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Error al crear el comprobante.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentComprobante) return;
    try {
      const payload = buildComprobantePayload(formData);
      const response = await actualizarComprobante(currentComprobante.ID_COMPROBANTE, payload);
      if (isSuccessResponse(response.data)) {
        showAlert('Actualizado', 'Comprobante actualizado correctamente.', 'success');
        setShowEditModal(false);
        await cargarDatosIniciales();
      } else {
        showAlert('Error', 'No se pudo actualizar el comprobante.', 'error');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Error al actualizar.', 'error');
    }
  };

  const borrarComprobante = async (id: string | number) => {
    const result = await Swal.fire({
      title: '¿Eliminar comprobante?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#ff6600',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (result.isConfirmed) {
      try {
        await eliminarComprobante(id);
        await cargarDatosIniciales();
        showAlert('Eliminado', 'Registro borrado.', 'success');
      } catch (error) {
        showAlert('Error', 'No se pudo eliminar.', 'error');
      }
    }
  };

  const getClienteKey = (c: ClienteRecord) => String(c.ID_CLIENTES);
  const getInformeKey = (i: InformeRecord) => String(i.ID_INFORME);
  const getAdminKey = (a: AdminRecord) => String(a.ID_ADMINISTRADOR);

  return (
    <div className="comprobantes-page">
      <div className="admin-section">
        <h1 className="admin-title">Gestión de Comprobantes</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, cliente o estado"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}><i className="bi bi-search"></i></button>
          </div>
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nuevo Comprobante
            </button>
            <button className="btn-reset" onClick={handleReset}><i className="bi bi-arrow-repeat"></i> Reset</button>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Cliente</th>
                <th>Informe</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando...</td></tr>
              ) : filteredComprobantes.length > 0 ? (
                filteredComprobantes.map(comp => (
                  <tr key={String(comp.ID_COMPROBANTE)}>
                    <td className="orden-id">{comp.ID_COMPROBANTE}</td>
                    <td>{comp.Fecha}</td>
                    <td>{formatMoneda(comp.Monto)}</td>
                    <td>{comp.ID_CLIENTES}</td>
                    <td>{comp.ID_INFORME || '-'}</td>
                    <td>
                      <span className={`badge-${comp.Estado_pago.toLowerCase()}`}>
                        {comp.Estado_pago}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(comp)}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn-eliminar-ktm" onClick={() => borrarComprobante(comp.ID_COMPROBANTE)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="loading-row">No hay comprobantes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CREAR con scroll */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Comprobante</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ID Comprobante *</label>
                  <input type="text" name="ID_COMPROBANTE" value={formData.ID_COMPROBANTE} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Cliente *</label>
                  <input list="clientes-list" name="ID_CLIENTES" value={formData.ID_CLIENTES} onChange={handleInputChange} required />
                  <datalist id="clientes-list">
                    {clientes.map(c => <option key={getClienteKey(c)} value={String(c.ID_CLIENTES)}>{c.Nombre}</option>)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Informe (opcional)</label>
                  <input list="informes-list" name="ID_INFORME" value={formData.ID_INFORME || ''} onChange={handleInputChange} />
                  <datalist id="informes-list">
                    {informes.map(i => <option key={getInformeKey(i)} value={String(i.ID_INFORME)} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Administrador (opcional)</label>
                  <input list="admins-list" name="ID_ADMINISTRADOR" value={formData.ID_ADMINISTRADOR || ''} onChange={handleInputChange} />
                  <datalist id="admins-list">
                    {administradores.map(a => <option key={getAdminKey(a)} value={String(a.ID_ADMINISTRADOR)} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Monto *</label>
                  <input type="number" name="Monto" value={formData.Monto} onChange={handleInputChange} min="0" step="100" required />
                </div>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Estado Pago *</label>
                  <select name="Estado_pago" value={formData.Estado_pago} onChange={handleInputChange} required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit">Crear Comprobante</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDITAR con scroll */}
      {showEditModal && currentComprobante && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Comprobante</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ID Comprobante</label>
                  <input type="text" name="ID_COMPROBANTE" value={formData.ID_COMPROBANTE} readOnly disabled />
                </div>
                <div className="form-group">
                  <label>Cliente *</label>
                  <input list="clientes-list-edit" name="ID_CLIENTES" value={formData.ID_CLIENTES} onChange={handleInputChange} required />
                  <datalist id="clientes-list-edit">
                    {clientes.map(c => <option key={getClienteKey(c)} value={String(c.ID_CLIENTES)}>{c.Nombre}</option>)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Informe</label>
                  <input list="informes-list-edit" name="ID_INFORME" value={formData.ID_INFORME || ''} onChange={handleInputChange} />
                  <datalist id="informes-list-edit">
                    {informes.map(i => <option key={getInformeKey(i)} value={String(i.ID_INFORME)} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Administrador</label>
                  <input list="admins-list-edit" name="ID_ADMINISTRADOR" value={formData.ID_ADMINISTRADOR || ''} onChange={handleInputChange} />
                  <datalist id="admins-list-edit">
                    {administradores.map(a => <option key={getAdminKey(a)} value={String(a.ID_ADMINISTRADOR)} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Monto *</label>
                  <input type="number" name="Monto" value={formData.Monto} onChange={handleInputChange} min="0" step="100" required />
                </div>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Estado Pago *</label>
                  <select name="Estado_pago" value={formData.Estado_pago} onChange={handleInputChange} required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableComprobantes;