import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerInformes,
  obtenerMisInformes,
  generarReporte,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  type InformePayload,
  type InformeRecord,
} from '../../services/informe.service';
import { generarComprobante, obtenerComprobantes } from '../../services/comprobanteService';

import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import { extractArray } from '../../utils/apiHelpers';
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


  const [comprobantesGenerados, setComprobantesGenerados] = useState<number[]>([]);

  const userRole = localStorage.getItem('user_role');
  
  // HU-004.1 Reportes
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFechas, setReportFechas] = useState({ fecha_inicio: '', fecha_fin: '' });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const fetchInformes = userRole === 'tecnico' ? obtenerMisInformes : obtenerInformes;
      
      const [informesRes, comprobantesRes] = await Promise.all([
        fetchInformes(),
        userRole === 'admin' ? obtenerComprobantes() : Promise.resolve({ data: [] }),
      ]);

      const data = extractArray<InformeRecord>(informesRes.data);
      setInformes(data);
      setFilteredInformes(data);
      
      const compData = extractArray(comprobantesRes.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComprobantesGenerados(compData.map((c: any) => c.id_orden));
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error', background: '#101010', color: '#f5f5f5' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleGenerarComprobante = async (informe: InformeRecord) => {
    let metodoPago = 'Pendiente';

    // Solo mostrar selector de método de pago si NO es admin
    if (userRole !== 'admin' && userRole !== 'administrador') {
      const result = await Swal.fire({
        title: `Generar Comprobante`,
        text: `Seleccione el método de pago para el informe #${informe.id_informe}:`,
        input: 'select',
        inputOptions: {
          Efectivo: 'Efectivo',
          Nequi: 'Nequi',
          Daviplata: 'Daviplata',
          Transferencia: 'Transferencia',
          Tarjeta: 'Tarjeta'
        },
        inputPlaceholder: 'Seleccione un método',
        showCancelButton: true,
        confirmButtonColor: '#ff6600',
        confirmButtonText: 'Generar',
        background: '#101010',
        color: '#f5f5f5',
        inputValidator: (value) => {
          if (!value) {
            return 'Debe seleccionar un método de pago';
          }
        }
      });
      if (!result.isConfirmed) return;
      metodoPago = result.value;
    } else {
      // Para admin, confirmar sin pedir método de pago
      const confirmResult = await Swal.fire({
        title: 'Generar Comprobante',
        text: `¿Generar comprobante para el informe #${informe.id_informe}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff6600',
        confirmButtonText: 'Sí, generar',
        cancelButtonText: 'Cancelar',
        background: '#101010',
        color: '#f5f5f5',
      });
      if (!confirmResult.isConfirmed) return;
    }
    
    try {
      await generarComprobante(informe.id_informe, metodoPago);
      showAlert('Éxito', 'Comprobante generado correctamente', 'success');
      await cargarDatos();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      showAlert('Error', err.response?.data?.message || 'No se pudo generar', 'error');
    }
  };

  const handleSubmitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportFechas.fecha_inicio || !reportFechas.fecha_fin) return;
    
    setLoading(true);
    try {
      const res = await generarReporte(reportFechas.fecha_inicio, reportFechas.fecha_fin);
      setInformes(res.data || []);
      setFilteredInformes(res.data || []);
      setShowReportModal(false);
      showAlert('Éxito', 'Reporte generado', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      showAlert('Error', err.response?.data?.message || 'Error al generar', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="informes-page">
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton to={userRole === 'tecnico' ? '/tecnico/dashboard' : '/admin/dashboard'} title={userRole === 'tecnico' ? 'Volver al Dashboard Técnico' : 'Volver al Dashboard'} />
          <h1 className="admin-title" style={{ margin: 0, borderBottom: 'none' }}>Informes Técnicos</h1>
        </div>

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
                      {userRole === 'admin' && !comprobantesGenerados.includes(inf.id_orden) && (
                        <button className="btn-edit-ktm" style={{backgroundColor: '#28a745'}} onClick={() => handleGenerarComprobante(inf)} title="Generar Comprobante">
                          <i className="bi bi-receipt"></i>
                        </button>
                      )}
                      <button className="btn-edit-ktm" onClick={() => openEditModal(inf)} title="Editar">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      {userRole === 'admin' && (
                        <button className="btn-eliminar-ktm" onClick={() => handleDelete(inf)} title="Eliminar">
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}
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
          <div className="modal-container" onClick={e => e.stopPropagation()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Informe' : 'Nuevo Informe Técnico'}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* ✅ VALIDACIÓN NUMÉRICA PARA ID */}
                <div className="form-group">
                  <label htmlFor="auto-id-36311">ID Orden *</label>
<input id="auto-id-36311"
                    type="number"
                    name="id_orden"
                    value={formData.id_orden || ''}
                    onChange={handleNumericIdInput}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="auto-id-36312">Técnico *</label>
<input id="auto-id-36312"
                    type="number"
                    name="id_tecnico"
                    value={formData.id_tecnico || ''}
                    onChange={handleNumericIdInput}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="auto-id-36313">Diagnóstico *</label>
<textarea id="auto-id-36313" name="diagnostico" value={formData.diagnostico || ''} onChange={handleInputChange} required rows={3} />
                </div>

                <div className="form-group">
                  <label htmlFor="auto-id-36314">Trabajo Realizado</label>
<textarea id="auto-id-36314" name="trabajo_realizado" value={formData.trabajo_realizado || ''} onChange={handleInputChange} rows={3} />
                </div>

                <div className="form-group">
                  <label htmlFor="auto-id-36315">Recomendaciones</label>
<textarea id="auto-id-36315" name="recomendaciones" value={formData.recomendaciones || ''} onChange={handleInputChange} rows={3} />
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

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}>
            <div className="modal-header">
              <h3>Generar Reporte por Fechas</h3>
              <button className="close-btn" onClick={() => setShowReportModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="auto-id-36316">Fecha Inicio *</label>
<input id="auto-id-36316"
                    type="date"
                    value={reportFechas.fecha_inicio}
                    onChange={(e) => setReportFechas(prev => ({...prev, fecha_inicio: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auto-id-36317">Fecha Fin *</label>
<input id="auto-id-36317"
                    type="date"
                    value={reportFechas.fecha_fin}
                    onChange={(e) => setReportFechas(prev => ({...prev, fecha_fin: e.target.value}))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowReportModal(false)}>Cancelar</button>
                <button type="submit">Generar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableInformes;