// src/components/TableMotos/Motos.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerMotos,
  crearMoto,
  actualizarMoto,
  eliminarMoto,
  type MotoPayload,
  type MotoRecord,
} from '../../services/moto.service'; 
import './Motos.css';
import { FormattedId } from '../../componentes/FormattedId';
const createInitialFormData = (): MotoPayload => ({
  ID_MOTOS: '',
  ID_CLIENTES: '',
  Placa: '',
  Modelo: '',
  Marca: '',
  Recorrido: 0,
});

const buildMotoPayload = (formData: MotoPayload): MotoPayload => {
  const id = String(formData.ID_MOTOS ?? '').trim();
  const idCliente = String(formData.ID_CLIENTES ?? '').trim();
  const placa = String(formData.Placa ?? '').trim().toUpperCase();
  const modelo = String(formData.Modelo ?? '').trim();
  const marca = String(formData.Marca ?? '').trim();
  const recorrido = Number(formData.Recorrido);

  if (!id) throw new Error('El ID de la moto es obligatorio.');
  if (!idCliente) throw new Error('El ID del cliente es obligatorio.');
  if (!placa) throw new Error('La placa es obligatoria.');
  if (!modelo) throw new Error('El modelo es obligatorio.');
  if (!marca) throw new Error('La marca es obligatoria.');
  if (isNaN(recorrido) || recorrido < 0) {
    throw new Error('El recorrido debe ser un número válido >= 0');
  }

  return {
    ID_MOTOS: id,
    ID_CLIENTES: idCliente,
    Placa: placa,
    Modelo: modelo,
    Marca: marca,
    Recorrido: recorrido,
  };
};

const readMotoArray = (value: unknown): MotoRecord[] | null => {
  if (Array.isArray(value)) return value as MotoRecord[];
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    if ('data' in nested) {
      const fromData = readMotoArray(nested.data);
      if (fromData) return fromData;
    }
    if ('motos' in nested) {
      const fromMotos = readMotoArray(nested.motos);
      if (fromMotos) return fromMotos;
    }
  }
  return null;
};

const extractMotos = (payload: unknown): MotoRecord[] => {
  if (Array.isArray(payload)) return payload as MotoRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as MotoRecord[];
    if (Array.isArray(obj.motos)) return obj.motos as MotoRecord[];
  }
  return readMotoArray(payload) ?? [];
};

const isSuccessfulResponse = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') return true;
  if ('success' in payload) return Boolean((payload as { success?: boolean }).success);
  return true;
};

const formatRecorrido = (recorrido: number): string => {
  return new Intl.NumberFormat('es-CO').format(recorrido);
};

function TableMotos() {
  const [motos, setMotos] = useState<MotoRecord[]>([]);
  const [filteredMotos, setFilteredMotos] = useState<MotoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMoto, setCurrentMoto] = useState<MotoRecord | null>(null);
  const [formData, setFormData] = useState<MotoPayload>(createInitialFormData());

  useEffect(() => {
    void cargarMotos();
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

  const cargarMotos = async () => {
    try {
      setLoading(true);
      const response = await obtenerMotos();
      const data = extractMotos(response.data);
      setMotos(data);
      setFilteredMotos(data);
    } catch (error) {
      console.error('Error al obtener motos:', error);
      setMotos([]);
      setFilteredMotos([]);
      showAlert('Error', 'No se pudieron cargar las motos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredMotos(motos);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = motos.filter(moto =>
      String(moto.ID_MOTOS).toLowerCase().includes(term) ||
      String(moto.ID_CLIENTES).toLowerCase().includes(term) ||
      moto.Placa.toLowerCase().includes(term) ||
      moto.Modelo.toLowerCase().includes(term) ||
      moto.Marca.toLowerCase().includes(term)
    );
    setFilteredMotos(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredMotos(motos);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev: MotoPayload) => ({ ...prev, [name]: value }) as MotoPayload);
  };

  const openCreateModal = () => {
    setCurrentMoto(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (moto: MotoRecord) => {
    setCurrentMoto(moto);
    setFormData({
      ID_MOTOS: moto.ID_MOTOS,
      ID_CLIENTES: moto.ID_CLIENTES,
      Placa: moto.Placa,
      Modelo: moto.Modelo,
      Marca: moto.Marca,
      Recorrido: moto.Recorrido,
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentMoto(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    const id = String(formData.ID_MOTOS ?? '').trim();
    const idCliente = String(formData.ID_CLIENTES ?? '').trim();
    const placa = String(formData.Placa ?? '').trim();
    const modelo = String(formData.Modelo ?? '').trim();
    const marca = String(formData.Marca ?? '').trim();
    const recorrido = formData.Recorrido;

    if (!id) return 'El ID de la moto es obligatorio.';
    if (!idCliente) return 'El ID del cliente es obligatorio.';
    if (!placa) return 'La placa es obligatoria.';
    if (!modelo) return 'El modelo es obligatorio.';
    if (!marca) return 'La marca es obligatoria.';
    if (isNaN(Number(recorrido)) || Number(recorrido) < 0) {
      return 'El recorrido debe ser un número válido mayor o igual a 0.';
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
      const payload = buildMotoPayload(formData);
      const response = await crearMoto(payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Moto registrada', 'La moto fue registrada correctamente.', 'success');
        closeCreateModal();
        await cargarMotos();
      } else {
        showAlert('Error', 'No se pudo registrar la moto.', 'error');
      }
    } catch (err) {
      console.error('Error al crear:', err);
      showAlert('Error', 'Ocurrió un error al registrar la moto.', 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentMoto) return;
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }
    try {
      const payload = buildMotoPayload(formData);
      const response = await actualizarMoto(currentMoto.ID_MOTOS, payload);
      if (isSuccessfulResponse(response.data)) {
        showAlert('Cambios guardados', 'La moto fue actualizada correctamente.', 'success');
        closeEditModal();
        await cargarMotos();
      } else {
        showAlert('Error', 'No se pudo actualizar la moto.', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      showAlert('Error', 'Ocurrió un error al actualizar la moto.', 'error');
    }
  };

  const borrarMoto = async (moto: MotoRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar la moto con placa "${moto.Placa}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarMoto(moto.ID_MOTOS);
      setMotos(prev => prev.filter(m => m.ID_MOTOS !== moto.ID_MOTOS));
      setFilteredMotos(prev => prev.filter(m => m.ID_MOTOS !== moto.ID_MOTOS));
      Swal.fire({
        title: 'Eliminada',
        text: 'La moto fue eliminada correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error al eliminar:', err);
      showAlert('Error', 'No se pudo eliminar la moto.', 'error');
    }
  };

  return (
    <div className="motos-page">
      <div className="admin-section">
        <h1 className="admin-title">Gestión de Motos</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, placa, modelo, marca o cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} title="Buscar">
              <i className="bi bi-search"></i>
            </button>
          </div>
          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nueva Moto
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-repeat"></i> Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6600' }}>
            <p>Cargando motos...</p>
          </div>
        ) : (
        <div className="table-responsive-container">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID Moto</th>
                <th>ID Cliente</th>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Recorrido (km)</th>
                <th>Acciones</th>
              </tr>
            </thead>
           <tbody>
  {filteredMotos.map((moto) => (
    <tr key={moto.ID_MOTOS} className="hover:bg-orange-900/20 transition-colors">
      
      {/* ✅ ID MOTO FORMATEADO */}
      <td className="font-mono text-orange-400 font-semibold tracking-wide">
        <FormattedId entity="moto" value={moto.ID_MOTOS} />
      </td>

      {/* ✅ ID CLIENTE FORMATEADO */}
      <td className="font-mono text-blue-400 font-semibold tracking-wide">
        <FormattedId entity="cliente" value={moto.ID_CLIENTES} />
      </td>

      {/* Las demás columnas se mantienen igual */}
      <td className="text-gray-200">{moto.Placa}</td>
      <td className="text-gray-200">{moto.Modelo}</td>
      <td className="text-gray-200">{moto.Marca}</td>
      <td className="text-gray-300">{formatRecorrido(moto.Recorrido)} km</td>
      
      <td className="flex gap-2">
        {/* Tus botones de Editar/Eliminar */}
        <button className="btn-editar" onClick={() => openEditModal(moto)}>✏️ Editar</button>
        <button className="btn-eliminar" onClick={() => borrarMoto(moto)}>🗑️ Eliminar</button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal Crear Moto */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nueva Moto</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>ID Moto</label>
                <input
                  type="text"
                  name="ID_MOTOS"
                  value={formData.ID_MOTOS}
                  onChange={handleInputChange}
                  placeholder="Ej: M1, M2, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>ID Cliente</label>
                <input
                  type="text"
                  name="ID_CLIENTES"
                  value={formData.ID_CLIENTES}
                  onChange={handleInputChange}
                  placeholder="ID del cliente dueño"
                  required
                />
              </div>
              <div className="form-group">
                <label>Placa</label>
                <input
                  type="text"
                  name="Placa"
                  value={formData.Placa}
                  onChange={handleInputChange}
                  placeholder="Ej: ABC123"
                  required
                />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="Modelo"
                  value={formData.Modelo}
                  onChange={handleInputChange}
                  placeholder="Ej: 250, 390, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleInputChange}
                  placeholder="Ej: DUKE, KTM, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Recorrido (km)</label>
                <input
                  type="number"
                  step="0.01"
                  name="Recorrido"
                  value={formData.Recorrido}
                  onChange={handleInputChange}
                  placeholder="Kilometraje actual"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit">Registrar Moto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Moto */}
      {showEditModal && currentMoto && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Moto</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>ID Moto</label>
                <input
                  type="text"
                  name="ID_MOTOS"
                  value={formData.ID_MOTOS}
                  required
                  title="El ID no se puede modificar"
                />
              </div>
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
                <label>Placa</label>
                <input
                  type="text"
                  name="Placa"
                  value={formData.Placa}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="Modelo"
                  value={formData.Modelo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Recorrido (km)</label>
                <input
                  type="number"
                  step="0.01"
                  name="Recorrido"
                  value={formData.Recorrido}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableMotos;