// src/components/TableInformes/Informe.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerInformes,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  type InformePayload,
  type InformeRecord,
} from '../../services/informeService'; 
import './Informe.css';

const createInitialFormData = (): InformePayload => ({
  ID_INFORMES: '',
  ID_MOTOS: '',
  Fecha: '',
  Descripcion: '',
  Diagnostico: '',
  Costo: 0,
});

const buildInformePayload = (formData: InformePayload): InformePayload => {
  const id = String(formData.ID_INFORMES ?? '').trim();
  const idMoto = String(formData.ID_MOTOS ?? '').trim();
  const fecha = String(formData.Fecha ?? '').trim();
  const descripcion = String(formData.Descripcion ?? '').trim();
  const diagnostico = String(formData.Diagnostico ?? '').trim();
  const costo = Number(formData.Costo);

  if (!id) throw new Error('El ID del informe es obligatorio.');
  if (!idMoto) throw new Error('El ID de la moto es obligatorio.');
  if (!fecha) throw new Error('La fecha es obligatoria.');
  if (!descripcion) throw new Error('La descripción es obligatoria.');
  if (isNaN(costo) || costo < 0) {
    throw new Error('El costo debe ser un número válido >= 0');
  }

  return {
    ID_INFORMES: id,
    ID_MOTOS: idMoto,
    Fecha: fecha,
    Descripcion: descripcion,
    Diagnostico: diagnostico,
    Costo: costo,
  };
};

const extractInformes = (payload: unknown): InformeRecord[] => {
  if (Array.isArray(payload)) return payload as InformeRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as InformeRecord[];
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

function TableInformes() {
  const [informes, setInformes] = useState<InformeRecord[]>([]);
  const [filteredInformes, setFilteredInformes] = useState<InformeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentInforme, setCurrentInforme] = useState<InformeRecord | null>(null);
  const [formData, setFormData] = useState<InformePayload>(createInitialFormData());

  useEffect(() => {
    void cargarInformes();
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

  const cargarInformes = async () => {
    try {
      setLoading(true);
      const response = await obtenerInformes();
      const data = extractInformes(response.data);
      setInformes(data);
      setFilteredInformes(data);
    } catch (error) {
      console.error('Error al obtener informes:', error);
      setInformes([]);
      setFilteredInformes([]);
      showAlert('Error', 'No se pudieron cargar los informes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredInformes(informes);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = informes.filter(inf =>
      String(inf.ID_INFORMES).toLowerCase().includes(term) ||
      String(inf.ID_MOTOS).toLowerCase().includes(term) ||
      inf.Descripcion.toLowerCase().includes(term) ||
      inf.Diagnostico.toLowerCase().includes(term)
    );
    setFilteredInformes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredInformes(informes);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = event.target;
  
  // Definimos que 'prev' es de tipo InformePayload
  setFormData((prev: InformePayload) => ({ 
    ...prev, 
    [name]: value 
  }));
};
  const openCreateModal = () => {
    setCurrentInforme(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (informe: InformeRecord) => {
    setCurrentInforme(informe);
    setFormData({
      ID_INFORMES: informe.ID_INFORMES,
      ID_MOTOS: informe.ID_MOTOS,
      Fecha: informe.Fecha.split('T')[0], // Ajuste para input type="date"
      Descripcion: informe.Descripcion,
      Diagnostico: informe.Diagnostico,
      Costo: informe.Costo,
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentInforme(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    if (!formData.ID_INFORMES) return 'El ID del informe es obligatorio.';
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
      const payload = buildInformePayload(formData);
      const response = await crearInforme(payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Informe creado', 'El informe técnico fue registrado.', 'success');
        closeCreateModal();
        await cargarInformes();
      }
    } catch (err) {
      showAlert('Error', 'No se pudo registrar el informe.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentInforme) return;
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const payload = buildInformePayload(formData);
      const response = await actualizarInforme(currentInforme.ID_INFORMES, payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Actualizado', 'Informe actualizado correctamente.', 'success');
        closeEditModal();
        await cargarInformes();
      }
    } catch (err) {
      showAlert('Error', 'Ocurrió un error al actualizar.', 'error');
    }
  };

  const borrarInforme = async (informe: InformeRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar informe ${informe.ID_INFORMES}?`,
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
      await eliminarInforme(informe.ID_INFORMES);
      await cargarInformes();
      Swal.fire({ title: 'Eliminado', icon: 'success', background: '#101010', color: '#f5f5f5', timer: 1500, showConfirmButton: false });
    } catch (err) {
      showAlert('Error', 'No se pudo eliminar el informe.', 'error');
    }
  };

  return (
    <div className="motos-page">
      <div className="admin-section">
        <h1 className="admin-title">Informes Técnicos</h1>

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
              <i className="bi bi-file-earmark-plus"></i> Nuevo Informe
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
                <th>ID Informe</th>
                <th>Moto</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Costo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="loading-row">Cargando informes...</td></tr>
              ) : filteredInformes.length > 0 ? (
                filteredInformes.map(inf => (
                  <tr key={inf.ID_INFORMES}>
                    <td>{inf.ID_INFORMES}</td>
                    <td>{inf.ID_MOTOS}</td>
                    <td>{new Date(inf.Fecha).toLocaleDateString()}</td>
                    <td>{inf.Descripcion.substring(0, 30)}...</td>
                    <td>{formatMoneda(inf.Costo)}</td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(inf)}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn-eliminar-ktm" onClick={() => borrarInforme(inf)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="loading-row">No hay informes registrados.</td></tr>
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
              <h3>{showCreateModal ? 'Nuevo Informe Técnico' : 'Editar Informe'}</h3>
              <button className="close-btn" onClick={showCreateModal ? closeCreateModal : closeEditModal}>&times;</button>
            </div>
            <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
              <div className="form-group">
                <label>ID Informe</label>
                <input type="text" name="ID_INFORMES" value={formData.ID_INFORMES} onChange={handleInputChange} readOnly={showEditModal} required />
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
                <button type="submit">{showCreateModal ? 'Guardar Informe' : 'Actualizar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableInformes;