// src/components/TableHistorial/Historial.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerHistorial,
  crearHistorial,
  actualizarHistorial,
  eliminarHistorial,
  type HistorialPayload,
  type HistorialRecord,
} from '../../services/historialService';
import { obtenerOrdenes, type OrdenServicioRecord } from '../../services/ordenServicioService';
import { obtenerComprobantes, type ComprobanteRecord } from '../../services/comprobanteService';
import { obtenerInformes, type InformeRecord } from '../../services/informeService';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnicosService';
import { obtenerClientes, type ClienteRecord } from '../../services/clientesService';
import './Historial.css';

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

const createInitialFormData = (): HistorialPayload => ({
  ID_HISTORIAL: '',
  ID_ORDEN_SERVICIO: '',
  ID_COMPROBANTE: '',
  ID_INFORME: '',
  ID_TECNICOS: '',
  ID_CLIENTES: '',
  Descripcion: '',        // ← sin acento (coincide con BD)
  Fecha_registro: '',
});

const buildHistorialPayload = (formData: HistorialPayload): HistorialPayload => {
  const id = String(formData.ID_HISTORIAL ?? '').trim();
  if (!id) throw new Error('El ID del historial es obligatorio.');
  if (!formData.Descripcion?.trim()) throw new Error('La descripción es obligatoria.');

  return {
    ID_HISTORIAL: id,
    ID_ORDEN_SERVICIO: formData.ID_ORDEN_SERVICIO || null,
    ID_COMPROBANTE: formData.ID_COMPROBANTE || null,
    ID_INFORME: formData.ID_INFORME || null,
    ID_TECNICOS: formData.ID_TECNICOS || null,
    ID_CLIENTES: formData.ID_CLIENTES || null,
    Descripcion: formData.Descripcion.trim(),
    Fecha_registro: formData.Fecha_registro || new Date().toISOString().split('T')[0],
  };
};

const extractHistorial = (payload: unknown): HistorialRecord[] => {
  if (Array.isArray(payload)) return payload as HistorialRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as HistorialRecord[];
  }
  return [];
};

const isSuccessfulResponse = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') return true;
  if ('success' in payload) return Boolean((payload as { success?: boolean }).success);
  return true;
};

function TableHistorial() {
  const [historial, setHistorial] = useState<HistorialRecord[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<HistorialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentHistorial, setCurrentHistorial] = useState<HistorialRecord | null>(null);
  const [formData, setFormData] = useState<HistorialPayload>(createInitialFormData());

  // Listas para datalist
  const [ordenes, setOrdenes] = useState<OrdenServicioRecord[]>([]);
  const [comprobantes, setComprobantes] = useState<ComprobanteRecord[]>([]);
  const [informes, setInformes] = useState<InformeRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);

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
      const [historialRes, ordenesRes, comprobantesRes, informesRes, tecnicosRes, clientesRes] = await Promise.all([
        obtenerHistorial(),
        obtenerOrdenes(),
        obtenerComprobantes(),
        obtenerInformes(),
        obtenerTecnicos(),
        obtenerClientes(),
      ]);
      const historialData = extractHistorial(historialRes.data);
      setHistorial(historialData);
      setFilteredHistorial(historialData);
      setOrdenes(extractArray(ordenesRes.data, []));
      setComprobantes(extractArray(comprobantesRes.data, []));
      setInformes(extractArray(informesRes.data, []));
      setTecnicos(extractArray(tecnicosRes.data, []));
      setClientes(extractArray(clientesRes.data, []));
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los datos necesarios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredHistorial(historial);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = historial.filter(h =>
      String(h.ID_HISTORIAL).toLowerCase().includes(term) ||
      (h.ID_ORDEN_SERVICIO?.toLowerCase().includes(term) ?? false) ||
      (h.ID_CLIENTES?.toLowerCase().includes(term) ?? false) ||
      h.Descripcion.toLowerCase().includes(term)
    );
    setFilteredHistorial(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredHistorial(historial);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setCurrentHistorial(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (h: HistorialRecord) => {
    setCurrentHistorial(h);
    setFormData({
      ID_HISTORIAL: h.ID_HISTORIAL,
      ID_ORDEN_SERVICIO: h.ID_ORDEN_SERVICIO || '',
      ID_COMPROBANTE: h.ID_COMPROBANTE || '',
      ID_INFORME: h.ID_INFORME || '',
      ID_TECNICOS: h.ID_TECNICOS || '',
      ID_CLIENTES: h.ID_CLIENTES || '',
      Descripcion: h.Descripcion,
      Fecha_registro: h.Fecha_registro?.split('T')[0] || '',
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentHistorial(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    if (!formData.ID_HISTORIAL) return 'El ID del historial es obligatorio.';
    if (!formData.Descripcion?.trim()) return 'La descripción es obligatoria.';
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
      const payload = buildHistorialPayload(formData);
      const response = await crearHistorial(payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Registro exitoso', 'El historial fue registrado.', 'success');
        closeCreateModal();
        await cargarDatosIniciales();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo registrar el historial.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentHistorial) return;
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const payload = buildHistorialPayload(formData);
      const response = await actualizarHistorial(currentHistorial.ID_HISTORIAL, payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Actualizado', 'Historial actualizado correctamente.', 'success');
        closeEditModal();
        await cargarDatosIniciales();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Ocurrió un error al actualizar.', 'error');
    }
  };

  const borrarHistorial = async (h: HistorialRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar registro ${h.ID_HISTORIAL}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarHistorial(h.ID_HISTORIAL);
      await cargarDatosIniciales();
      Swal.fire({ title: 'Eliminado', icon: 'success', background: '#101010', color: '#f5f5f5', timer: 1500, showConfirmButton: false });
    } catch (err) {
      showAlert('Error', 'No se pudo eliminar el registro.', 'error');
    }
  };

  return (
    <div className="historial-page">
      <div className="admin-section">
        <h1 className="admin-title">Historial de Servicios</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, orden, cliente o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
              <i className="bi bi-search"></i>
            </button>
          </div>
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-clock-history"></i> Nuevo Registro
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
                <th>ID Historial</th>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Fecha Registro</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="loading-row">Cargando historial...</td>
                </tr>
              ) : filteredHistorial.length > 0 ? (
                filteredHistorial.map((h) => (
                  <tr key={h.ID_HISTORIAL}>
                    <td className="orden-id">{h.ID_HISTORIAL}</td>
                    <td>{h.ID_ORDEN_SERVICIO || '-'}</td>
                    <td>{h.ID_CLIENTES || '-'}</td>
                    <td>{h.Fecha_registro ? new Date(h.Fecha_registro).toLocaleDateString() : '-'}</td>
                    <td>{h.Descripcion.substring(0, 40)}...</td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(h)}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn-eliminar-ktm" onClick={() => borrarHistorial(h)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="loading-row">No hay registros en el historial.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showCreateModal ? 'Nuevo Registro de Historial' : 'Editar Historial'}</h3>
              <button className="close-btn" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <div className="form-group">
                <label>ID Historial *</label>
                <input
                  type="text"
                  name="ID_HISTORIAL"
                  value={formData.ID_HISTORIAL}
                  onChange={handleInputChange}
                  readOnly={showEditModal}
                  required
                />
              </div>
              <div className="form-group">
                <label>Orden de Servicio</label>
                <input
                  list="ordenes-list"
                  name="ID_ORDEN_SERVICIO"
                  value={formData.ID_ORDEN_SERVICIO || ''}
                  onChange={handleInputChange}
                />
                <datalist id="ordenes-list">
                  {ordenes.map((ord) => (
                    <option key={ord.ID_ORDEN_SERVICIO} value={ord.ID_ORDEN_SERVICIO} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Comprobante</label>
                <input
                  list="comprobantes-list"
                  name="ID_COMPROBANTE"
                  value={formData.ID_COMPROBANTE || ''}
                  onChange={handleInputChange}
                />
                <datalist id="comprobantes-list">
                  {comprobantes.map((c) => (
                    <option key={c.ID_COMPROBANTE} value={c.ID_COMPROBANTE} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Informe</label>
                <input
                  list="informes-list"
                  name="ID_INFORME"
                  value={formData.ID_INFORME || ''}
                  onChange={handleInputChange}
                />
                <datalist id="informes-list">
                  {informes.map((i) => (
                    <option key={i.ID_INFORME} value={i.ID_INFORME} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Técnico</label>
                <input
                  list="tecnicos-list"
                  name="ID_TECNICOS"
                  value={formData.ID_TECNICOS || ''}
                  onChange={handleInputChange}
                />
                <datalist id="tecnicos-list">
                  {tecnicos.map((t) => (
                    <option key={t.ID_TECNICOS} value={t.ID_TECNICOS} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <input
                  list="clientes-list"
                  name="ID_CLIENTES"
                  value={formData.ID_CLIENTES || ''}
                  onChange={handleInputChange}
                />
                <datalist id="clientes-list">
                  {clientes.map((c) => (
                    <option key={c.ID_CLIENTES} value={c.ID_CLIENTES} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <textarea name="Descripcion" value={formData.Descripcion} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Fecha de Registro</label>
                <input
                  type="date"
                  name="Fecha_registro"
                  value={formData.Fecha_registro}
                  onChange={handleInputChange}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">{showCreateModal ? 'Guardar Registro' : 'Actualizar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableHistorial;