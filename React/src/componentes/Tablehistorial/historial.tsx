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
import './Historial.css';

const createInitialFormData = (): HistorialPayload => ({
  ID_HISTORIAL: '',
  ID_MOTOS: '',
  Fecha: '',
  Descripcion: '',
  Diagnostico: '',
  Costo: 0,
});

const buildHistorialPayload = (formData: HistorialPayload): HistorialPayload => {
  const id = String(formData.ID_HISTORIAL ?? '').trim();
  const idMoto = String(formData.ID_MOTOS ?? '').trim();
  const fecha = String(formData.Fecha ?? '').trim();
  const descripcion = String(formData.Descripcion ?? '').trim();
  const diagnostico = String(formData.Diagnostico ?? '').trim();
  const costo = Number(formData.Costo);

  if (!id) throw new Error('El ID del historial es obligatorio.');
  if (!idMoto) throw new Error('El ID de la moto es obligatorio.');
  if (!fecha) throw new Error('La fecha es obligatoria.');
  if (!descripcion) throw new Error('La descripción es obligatoria.');
  if (isNaN(costo) || costo < 0) {
    throw new Error('El costo debe ser un número válido >= 0');
  }

  return {
    ID_HISTORIAL: id,
    ID_MOTOS: idMoto,
    Fecha: fecha,
    Descripcion: descripcion,
    Diagnostico: diagnostico,
    Costo: costo,
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

const formatMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
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

  useEffect(() => {
    void cargarHistorial();
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

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await obtenerHistorial();
      const data = extractHistorial(response.data);
      setHistorial(data);
      setFilteredHistorial(data);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      setHistorial([]);
      setFilteredHistorial([]);
      showAlert('Error', 'No se pudo cargar el historial.', 'error');
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
      String(h.ID_MOTOS).toLowerCase().includes(term) ||
      h.Descripcion.toLowerCase().includes(term) ||
      h.Diagnostico.toLowerCase().includes(term)
    );
    setFilteredHistorial(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredHistorial(historial);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev: HistorialPayload) => ({ 
      ...prev, 
      [name]: value 
    }));
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
      ID_MOTOS: h.ID_MOTOS,
      Fecha: h.Fecha.split('T')[0],
      Descripcion: h.Descripcion,
      Diagnostico: h.Diagnostico,
      Costo: h.Costo,
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
    if (!formData.ID_MOTOS) return 'El ID de la moto es obligatorio.';
    if (!formData.Fecha) return 'La fecha es obligatoria.';
    if (!formData.Descripcion) return 'La descripción es obligatoria.';
    if (isNaN(Number(formData.Costo)) || Number(formData.Costo) < 0) {
      return 'El costo debe ser un número válido.';
    }
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
        showAlert('Registro exitoso', 'El historial técnico fue registrado.', 'success');
        closeCreateModal();
        await cargarHistorial();
      }
    } catch (err) {
      showAlert('Error', 'No se pudo registrar el historial.', 'error');
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
        await cargarHistorial();
      }
    } catch (err) {
      showAlert('Error', 'Ocurrió un error al actualizar.', 'error');
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
      await cargarHistorial();
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
              placeholder="Buscar por ID, moto, descripción o diagnóstico"
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
                <th>Moto</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Costo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="loading-row">Cargando historial...</td></tr>
              ) : filteredHistorial.length > 0 ? (
                filteredHistorial.map(h => (
                  <tr key={h.ID_HISTORIAL}>
                    <td>{h.ID_HISTORIAL}</td>
                    <td>{h.ID_MOTOS}</td>
                    <td>{new Date(h.Fecha).toLocaleDateString()}</td>
                    <td>{h.Descripcion.substring(0, 30)}...</td>
                    <td>{formatMoneda(h.Costo)}</td>
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
                <tr><td colSpan={6} className="loading-row">No hay registros en el historial.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showCreateModal ? 'Nuevo Registro de Historial' : 'Editar Historial'}</h3>
              <button className="close-btn" onClick={showCreateModal ? closeCreateModal : closeEditModal}>&times;</button>
            </div>
            <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <div className="form-group">
                <label>ID Historial</label>
                <input type="text" name="ID_HISTORIAL" value={formData.ID_HISTORIAL} onChange={handleInputChange} readOnly={showEditModal} required />
              </div>
              <div className="form-group">
                <label>ID Moto</label>
                <input type="text" name="ID_MOTOS" value={formData.ID_MOTOS} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea name="Descripcion" value={formData.Descripcion} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Diagnóstico</label>
                <textarea name="Diagnostico" value={formData.Diagnostico} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Costo del Servicio</label>
                <input type="number" name="Costo" value={formData.Costo} onChange={handleInputChange} required />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={showCreateModal ? closeCreateModal : closeEditModal}>Cancelar</button>
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