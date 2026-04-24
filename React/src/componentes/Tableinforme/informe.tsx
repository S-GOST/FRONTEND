import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerInformes,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  type InformePayload,
  type InformeRecord,
} from '../../services/informeService';
// Servicios para obtener las tablas relacionadas
import { obtenerDetallesOrdenes, type DetalleOrdenServicioRecord } from '../../services/detalleOrdenServicioService';
import { obtenerAdmins, type AdminRecord } from '../../services/adminService';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnicosService';
import './Informe.css';

// Función para generar el próximo ID_INFORME (INF1, INF2, ...)
const generarIdInforme = async (): Promise<string> => {
  try {
    const response = await obtenerInformes();
    const informes = Array.isArray(response.data) ? response.data : response.data?.data || [];
    if (informes.length === 0) return 'INF1';
    const ids = informes.map((inf: InformeRecord) => inf.ID_INFORME);
    const numeros = ids
      .map(id => parseInt(id.replace('INF', ''), 10))
      .filter(num => !isNaN(num));
    const maxNum = Math.max(...numeros, 0);
    return `INF${maxNum + 1}`;
  } catch {
    return 'INF1';
  }
};

// Estado inicial del formulario
const initialFormState: InformePayload = {
  ID_INFORME: '',
  ID_DETALLES_ORDEN_SERVICIO: '',
  ID_ADMINISTRADOR: '',
  ID_TECNICOS: '',
  Descripcion: '',
  Fecha: '',
  Estado: 'Pendiente',
};

const TableInformes = () => {
  const [informes, setInformes] = useState<InformeRecord[]>([]);
  const [filteredInformes, setFilteredInformes] = useState<InformeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentInforme, setCurrentInforme] = useState<InformeRecord | null>(null);
  const [formData, setFormData] = useState<InformePayload>(initialFormState);

  // Datos para los selects/datalist
  const [detallesOrdenes, setDetallesOrdenes] = useState<DetalleOrdenServicioRecord[]>([]);
  const [administradores, setAdministradores] = useState<AdminRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);

  // Cargar todos los datos necesarios
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [informesRes, detallesRes, adminsRes, tecnicosRes] = await Promise.all([
        obtenerInformes(),
        obtenerDetallesOrdenes(),
        obtenerAdmins(),
        obtenerTecnicos(),
      ]);

      const informesData = Array.isArray(informesRes.data)
        ? informesRes.data
        : informesRes.data?.data || [];
      setInformes(informesData);
      setFilteredInformes(informesData);

      setDetallesOrdenes(Array.isArray(detallesRes.data) ? detallesRes.data : detallesRes.data?.data || []);
      setAdministradores(Array.isArray(adminsRes.data) ? adminsRes.data : adminsRes.data?.data || []);
      setTecnicos(Array.isArray(tecnicosRes.data) ? tecnicosRes.data : tecnicosRes.data?.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error', background: '#101010', color: '#f5f5f5' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning') => {
    return Swal.fire({ title, text, icon, confirmButtonColor: '#ff6600', background: '#101010', color: '#f5f5f5' });
  };

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    if (!term) {
      setFilteredInformes(informes);
      return;
    }
    const filtered = informes.filter(inf =>
      inf.ID_INFORME.toLowerCase().includes(term) ||
      inf.ID_DETALLES_ORDEN_SERVICIO.toLowerCase().includes(term) ||
      inf.ID_ADMINISTRADOR.toLowerCase().includes(term) ||
      (inf.ID_TECNICOS && inf.ID_TECNICOS.toLowerCase().includes(term)) ||
      inf.Descripcion.toLowerCase().includes(term) ||
      inf.Estado.toLowerCase().includes(term)
    );
    setFilteredInformes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredInformes(informes);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = async () => {
    setEditMode(false);
    setCurrentInforme(null);
    const nuevoId = await generarIdInforme();
    setFormData({ ...initialFormState, ID_INFORME: nuevoId, Fecha: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (informe: InformeRecord) => {
    setEditMode(true);
    setCurrentInforme(informe);
    setFormData({
      ...informe,
      Fecha: informe.Fecha.split('T')[0], // para input date
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormState);
    setCurrentInforme(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    if (!formData.ID_DETALLES_ORDEN_SERVICIO || !formData.ID_ADMINISTRADOR || !formData.Fecha || !formData.Descripcion) {
      showAlert('Campos incompletos', 'Completa los campos obligatorios.', 'warning');
      return;
    }

    try {
      if (editMode && currentInforme) {
        await actualizarInforme(currentInforme.ID_INFORME, formData);
        showAlert('Actualizado', 'El informe se actualizó correctamente', 'success');
      } else {
        await crearInforme(formData);
        showAlert('Creado', 'Informe técnico registrado', 'success');
      }
      closeModal();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo guardar el informe', 'error');
    }
  };

  const handleDelete = async (informe: InformeRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar informe ${informe.ID_INFORME}?`,
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#a51f1f',
      confirmButtonText: 'Sí, eliminar',
      background: '#101010',
      color: '#f5f5f5',
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarInforme(informe.ID_INFORME);
      await cargarDatos();
      showAlert('Eliminado', 'Informe eliminado', 'success');
    } catch (err) {
      showAlert('Error', 'No se pudo eliminar', 'error');
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
              placeholder="Buscar por ID, orden, admin, técnico, descripción"
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
                <th>Detalle Orden</th>
                <th>Administrador</th>
                <th>Técnico</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="loading-row">Cargando...</td></tr>
              ) : filteredInformes.length === 0 ? (
                <tr><td colSpan={8} className="loading-row">No hay informes registrados</td></tr>
              ) : (
                filteredInformes.map(inf => (
                  <tr key={inf.ID_INFORME}>
                    <td>{inf.ID_INFORME}</td>
                    <td>{inf.ID_DETALLES_ORDEN_SERVICIO}</td>
                    <td>{inf.ID_ADMINISTRADOR}</td>
                    <td>{inf.ID_TECNICOS || '-'}</td>
                    <td>{inf.Descripcion.substring(0, 40)}...</td>
                    <td>{new Date(inf.Fecha).toLocaleDateString()}</td>
                    <td>{inf.Estado}</td>
                    <td className="actions-cell">
                      <button className="btn-edit-ktm" onClick={() => openEditModal(inf)}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn-eliminar-ktm" onClick={() => handleDelete(inf)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Informe' : 'Nuevo Informe Técnico'}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* ID_INFORME - solo lectura en edición */}
                <div className="form-group">
                  <label>ID Informe</label>
                  <input type="text" name="ID_INFORME" value={formData.ID_INFORME} required/>
                </div>

                {/* Detalle de Orden - input con datalist */}
                <div className="form-group">
                  <label>Detalle de Orden *</label>
                  <input
                    list="detalles-list"
                    name="ID_DETALLES_ORDEN_SERVICIO"
                    value={formData.ID_DETALLES_ORDEN_SERVICIO}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                  />
                  <datalist id="detalles-list">
                    {detallesOrdenes.map(det => (
                      <option key={det.ID_DETALLES_ORDEN_SERVICIO} value={det.ID_DETALLES_ORDEN_SERVICIO}>
                        {det.ID_DETALLES_ORDEN_SERVICIO} - Orden: {det.ID_ORDEN_SERVICIO}
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Administrador - input con datalist */}
                <div className="form-group">
                  <label>Administrador *</label>
                  <input
                    list="admins-list"
                    name="ID_ADMINISTRADOR"
                    value={formData.ID_ADMINISTRADOR}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                  />
                  <datalist id="admins-list">
                    {administradores.map(adm => (
                      <option key={adm.ID_ADMINISTRADOR} value={adm.ID_ADMINISTRADOR}>
                        {adm.Nombre} ({adm.ID_ADMINISTRADOR})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Técnico - opcional con datalist */}
                <div className="form-group">
                  <label>Técnico</label>
                  <input
                    list="tecnicos-list"
                    name="ID_TECNICOS"
                    value={formData.ID_TECNICOS || ''}
                    onChange={handleInputChange}
                    autoComplete="off"
                  />
                  <datalist id="tecnicos-list">
                    {tecnicos.map(tec => (
                      <option key={tec.ID_TECNICOS} value={tec.ID_TECNICOS}>
                        {tec.Nombre} ({tec.ID_TECNICOS})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Fecha */}
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} required />
                </div>

                {/* Descripción (texto largo) */}
                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea name="Descripcion" value={formData.Descripcion} onChange={handleInputChange} required rows={4} />
                </div>

                {/* Estado */}
                <div className="form-group">
                  <label>Estado *</label>
                  <select name="Estado" value={formData.Estado} onChange={handleInputChange} required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En espera de repuestos">En espera de repuestos</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal}>Cancelar</button>
                <button type="submit">{editMode ? 'Actualizar' : 'Crear Informe'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableInformes;