// src/components/TableHistorial/Historial.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerHistorial,
  type HistorialRecord,
} from '../../services/historial.service';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import './Historial.css';
import { extractArray } from '../../utils/apiHelpers';


function TableHistorial() {
  const [historial, setHistorial] = useState<HistorialRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccion, setFilterAccion] = useState('');


  useEffect(() => {
    void cargarDatosIniciales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const historialRes = await obtenerHistorial();
      const historialData = extractArray<HistorialRecord>(historialRes.data);
      setHistorial(historialData);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los datos del historial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterAccion('');
  };

  // Filtrado
  const filteredHistorial = historial.filter(h => {
    const matchesSearch = !searchTerm || 
      String(h.id_historial).includes(searchTerm.toLowerCase()) ||
      String(h.id_usuario).includes(searchTerm.toLowerCase()) ||
      (h.tabla_afectada || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.accion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccion = !filterAccion || h.accion?.toUpperCase() === filterAccion.toUpperCase();
    
    return matchesSearch && matchesAccion;
  });

  // Badge de color según la acción
  const getAccionBadge = (accion: string) => {
    const a = accion?.toUpperCase() || '';
    const colors: Record<string, { bg: string; text: string }> = {
      'INSERT': { bg: 'rgba(40, 167, 69, 0.2)', text: '#28a745' },
      'UPDATE': { bg: 'rgba(255, 193, 7, 0.2)', text: '#ffc107' },
      'DELETE': { bg: 'rgba(220, 53, 69, 0.2)', text: '#dc3545' },
      'LOGIN': { bg: 'rgba(0, 123, 255, 0.2)', text: '#007bff' },
      'LOGOUT': { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d' },
    };
    const color = colors[a] || { bg: 'rgba(108,117,125,0.2)', text: '#6c757d' };
    return (
      <span style={{
        padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
        background: color.bg, color: color.text, border: `1px solid ${color.text}`,
      }}>
        {accion}
      </span>
    );
  };

  return (
    <div className="historial-page">
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton />
          <h1 className="admin-title" style={{ margin: 0, borderBottom: 'none' }}>Registro de Auditoría (Historial)</h1>
        </div>

        <p style={{ color: '#aaa', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-shield-lock" style={{ color: 'var(--ktm-orange)' }}></i>
          Este registro es inmutable. No se permite modificar ni eliminar entradas de auditoría.
        </p>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, tabla, usuario o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="search-input"
              style={{ maxWidth: '160px' }}
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
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
                <th>ID</th>
                <th>Usuario</th>
                <th>Tabla Afectada</th>
                <th>ID Registro</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-row">Cargando historial...</td>
                </tr>
              ) : filteredHistorial.length > 0 ? (
                filteredHistorial.map((h) => (
                  <tr key={h.id_historial}>
                    <td className="orden-id"><FormattedId entity="historial" value={h.id_historial} /></td>
                    <td><FormattedId entity="usuario" value={h.id_usuario} /></td>
                    <td>{h.tabla_afectada}</td>
                    <td>{h.id_registro}</td>
                    <td>{getAccionBadge(h.accion)}</td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.descripcion || '-'}
                    </td>
                    <td>{h.fecha_registro ? new Date(h.fecha_registro).toLocaleString() : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="loading-row">No hay registros en el historial.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}

export default TableHistorial;