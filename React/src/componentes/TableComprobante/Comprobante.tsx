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
import './Comprobante.css';

const createInitialFormData = (): ComprobantePayload => ({
  ID_COMPROBANTE: '',
  Fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
  Valor_Total: 0,
  ID_CLIENTE: '',
  ID_MOTOS: '',
  ID_SERVICIOS: '',
  Estado: 'Pendiente',
});

const buildComprobantePayload = (formData: ComprobantePayload): ComprobantePayload => {
  const id = String(formData.ID_COMPROBANTE ?? '').trim();
  const fecha = String(formData.Fecha ?? '').trim();
  const valorTotal = Number(formData.Valor_Total);
  const idCliente = String(formData.ID_CLIENTE ?? '').trim();
  const idMoto = String(formData.ID_MOTOS ?? '').trim();
  const idServicio = String(formData.ID_SERVICIOS ?? '').trim();
  const estado = String(formData.Estado ?? '').trim();

  if (!id) throw new Error('El ID del comprobante es obligatorio.');
  if (!fecha) throw new Error('La fecha es obligatoria.');
  if (isNaN(valorTotal) || valorTotal < 0) throw new Error('El valor total debe ser un número válido.');
  if (!idCliente) throw new Error('El ID del cliente es obligatorio.');

  return {
    ID_COMPROBANTE: id,
    Fecha: fecha,
    Valor_Total: valorTotal,
    ID_CLIENTE: idCliente,
    ID_MOTOS: idMoto,
    ID_SERVICIOS: idServicio,
    Estado: estado,
  };
};

const extractComprobantes = (payload: unknown): ComprobanteRecord[] => {
  if (Array.isArray(payload)) return payload as ComprobanteRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ComprobanteRecord[];
    if (Array.isArray(obj.comprobantes)) return obj.comprobantes as ComprobanteRecord[];
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

function TableComprobantes() {
  const [comprobantes, setComprobantes] = useState<ComprobanteRecord[]>([]);
  const [filteredComprobantes, setFilteredComprobantes] = useState<ComprobanteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentComprobante, setCurrentComprobante] = useState<ComprobanteRecord | null>(null);
  const [formData, setFormData] = useState<ComprobantePayload>(createInitialFormData());

  useEffect(() => {
    void cargarComprobantes();
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

  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      const response = await obtenerComprobantes();
      const data = extractComprobantes(response.data);
      setComprobantes(data);
      setFilteredComprobantes(data);
    } catch (error) {
      console.error('Error al obtener comprobantes:', error);
      showAlert('Error', 'No se pudieron cargar los comprobantes.', 'error');
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
    const filtered = comprobantes.filter(comp =>
      String(comp.ID_COMPROBANTE).toLowerCase().includes(term) ||
      String(comp.ID_CLIENTE).toLowerCase().includes(term) ||
      comp.Estado.toLowerCase().includes(term)
    );
    setFilteredComprobantes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredComprobantes(comprobantes);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      Fecha: comp.Fecha,
      Valor_Total: comp.Valor_Total,
      ID_CLIENTE: comp.ID_CLIENTE,
      ID_MOTOS: comp.ID_MOTOS,
      ID_SERVICIOS: comp.ID_SERVICIOS,
      Estado: comp.Estado,
    });
    setShowEditModal(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = buildComprobantePayload(formData);
      const response = await crearComprobante(payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Éxito', 'Comprobante generado.', 'success');
        setShowCreateModal(false);
        await cargarComprobantes();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Error al crear', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentComprobante) return;
    try {
      const payload = buildComprobantePayload(formData);
      const response = await actualizarComprobante(currentComprobante.ID_COMPROBANTE, payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Actualizado', 'Comprobante actualizado correctamente.', 'success');
        setShowEditModal(false);
        await cargarComprobantes();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Error al actualizar', 'error');
    }
  };

  const borrarComprobante = async (id: string) => {
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
        await cargarComprobantes();
        showAlert('Eliminado', 'Registro borrado.', 'success');
      } catch (error) {
        showAlert('Error', 'No se pudo eliminar.', 'error');
      }
    }
  };

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
                <th>Valor Total</th>
                <th>ID Cliente</th>
                <th>ID Moto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando...</td></tr>
              ) : filteredComprobantes.length > 0 ? (
                filteredComprobantes.map(comp => (
                  <tr key={comp.ID_COMPROBANTE}>
                    <td>{comp.ID_COMPROBANTE}</td>
                    <td>{comp.Fecha}</td>
                    <td>{formatMoneda(comp.Valor_Total)}</td>
                    <td>{comp.ID_CLIENTE}</td>
                    <td>{comp.ID_MOTOS}</td>
                    <td><span className={`badge-${comp.Estado.toLowerCase()}`}>{comp.Estado}</span></td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(comp)}><i className="bi bi-pencil-square"></i></button>
                      <button className="btn-eliminar-ktm" onClick={() => borrarComprobante(String(comp.ID_COMPROBANTE))}></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="loading-row">No hay registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Nuevo Comprobante</h3></div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>ID Comprobante</label><input type="text" name="ID_COMPROBANTE" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Fecha</label><input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Valor Total</label><input type="number" name="Valor_Total" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>ID Cliente</label><input type="text" name="ID_CLIENTE" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>ID Moto</label><input type="text" name="ID_MOTOS" onChange={handleInputChange} /></div>
              <div className="form-group">
                <label>Estado</label>
                <select name="Estado" value={formData.Estado} onChange={handleInputChange}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit">Generar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && currentComprobante && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Editar Comprobante</h3></div>
            <form onSubmit={handleUpdate}>
              <div className="form-group"><label>ID Comprobante</label><input type="text" name="ID_COMPROBANTE" value={formData.ID_COMPROBANTE} readOnly /></div>
              <div className="form-group"><label>Valor Total</label><input type="number" name="Valor_Total" value={formData.Valor_Total} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Estado</label>
                <select name="Estado" value={formData.Estado} onChange={handleInputChange}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Anulado">Anulado</option>
                </select>
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