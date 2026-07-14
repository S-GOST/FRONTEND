import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerInformes,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  type InformePayload,
  type InformeRecord,
} from '../../services/informe.service';
import { obtenerDetallesOrdenes, type DetalleOrdenServicioRecord } from '../../services/detalleOrdenServicioService';
import { obtenerAdmins, type AdminRecord } from '../../services/admin.service';
import { obtenerTecnicos, type TecnicoRecord } from '../../services/tecnico.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Informe.css';

const initialFormState: InformePayload = {
  id_orden: 0,
  id_tecnico: 0,
  diagnostico: '',
  trabajo_realizado: '',
  recomendaciones: '',
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

  const [detallesOrdenes, setDetallesOrdenes] = useState<DetalleOrdenServicioRecord[]>([]);
  const [administradores, setAdministradores] = useState<AdminRecord[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoRecord[]>([]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [informesRes, detallesRes, adminsRes, tecnicosRes] = await Promise.all([
        obtenerInformes(),
        obtenerDetallesOrdenes(),
        obtenerAdmins(),
        obtenerTecnicos(),
      ]);

      setInformes(Array.isArray(informesRes.data) ? informesRes.data : informesRes.data?.data || []);
      setFilteredInformes(Array.isArray(informesRes.data) ? informesRes.data : informesRes.data?.data || []);
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
      String(inf.id_informe).includes(term) ||
      String(inf.id_orden).includes(term) ||
      String(inf.id_tecnico).includes(term) ||
      (inf.diagnostico && inf.diagnostico.toLowerCase().includes(term)) ||
      (inf.trabajo_realizado && inf.trabajo_realizado.toLowerCase().includes(term))
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

  // ✅ MANEJADOR UNIFICADO: SOLO NÚMEROS PARA TODOS LOS CAMPOS DE ID
  const handleNumericIdInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitized = value.replace(/\D/g, ''); // Elimina todo lo que no sea dígito

    if (value !== sanitized) {
      Swal.fire({
        title: 'Solo números permitidos',
        text: 'Este campo solo acepta IDs numéricos.',
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
    setFormData(prev => ({ ...prev, [name]: sanitized === '' ? 0 : Number(sanitized) }));
  };

  const openCreateModal = async () => {
    setEditMode(false);
    setCurrentInforme(null);
    setFormData({ ...initialFormState });
    setShowModal(true);
  };

  const openEditModal = (informe: InformeRecord) => {
    setEditMode(true);
    setCurrentInforme(informe);
    setFormData({ 
      id_orden: informe.id_orden,
      id_tecnico: informe.id_tecnico,
      diagnostico: informe.diagnostico || '',
      trabajo_realizado: informe.trabajo_realizado || '',
      recomendaciones: informe.recomendaciones || ''
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
    if (!formData.id_orden || !formData.id_tecnico || !formData.diagnostico) {
      showAlert('Campos incompletos', 'Completa los campos obligatorios.', 'warning');
      return;
    }

    try {
      if (editMode && currentInforme) {
        await actualizarInforme(currentInforme.id_informe, formData);
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
      title: `¿Eliminar informe ${informe.id_informe}?`,
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
      await eliminarInforme(informe.id_informe);
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
                <th>Orden</th>
                <th>Técnico</th>
                <th>Diagnóstico</th>
                <th>Trabajo Realizado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando...</td></tr>
              ) : filteredInformes.length === 0 ? (
                <tr><td colSpan={7} className="loading-row">No hay informes registrados</td></tr>
              ) : (
                filteredInformes.map(inf => (
                  <tr key={inf.id_informe}>
                    <td><FormattedId entity="informe" value={inf.id_informe} /></td>
                    <td><FormattedId entity="orden" value={inf.id_orden} /></td>
                    <td>{inf.id_tecnico ? <FormattedId entity="tecnico" value={inf.id_tecnico} /> : '-'}</td>
                    <td>{(inf.diagnostico || '').substring(0, 40)}...</td>
                    <td>{(inf.trabajo_realizado || '').substring(0, 40)}...</td>
                    <td>{inf.fecha ? new Date(inf.fecha).toLocaleDateString() : '-'}</td>
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Informe' : 'Nuevo Informe Técnico'}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* ✅ VALIDACIÓN NUMÉRICA PARA ID */}
                <div className="form-group">
                  <label>ID Orden *</label>
                  <input
                    type="number"
                    name="id_orden"
                    value={formData.id_orden || ''}
                    onChange={handleNumericIdInput}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Técnico *</label>
                  <input
                    type="number"
                    name="id_tecnico"
                    value={formData.id_tecnico || ''}
                    onChange={handleNumericIdInput}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Diagnóstico *</label>
                  <textarea name="diagnostico" value={formData.diagnostico || ''} onChange={handleInputChange} required rows={3} />
                </div>

                <div className="form-group">
                  <label>Trabajo Realizado</label>
                  <textarea name="trabajo_realizado" value={formData.trabajo_realizado || ''} onChange={handleInputChange} rows={3} />
                </div>

                <div className="form-group">
                  <label>Recomendaciones</label>
                  <textarea name="recomendaciones" value={formData.recomendaciones || ''} onChange={handleInputChange} rows={3} />
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