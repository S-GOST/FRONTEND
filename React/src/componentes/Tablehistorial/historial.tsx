// src/components/TableHistorial/Historial.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerHistorial,
  eliminarHistorial,
  type HistorialRecord,
} from '../../services/historial.service';
import { FormattedId } from '../../componentes/FormattedId';
import './Historial.css';

const extractHistorial = (payload: unknown): HistorialRecord[] => {
  if (Array.isArray(payload)) return payload as HistorialRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as HistorialRecord[];
  }
  return [];
};

function TableHistorial() {
  const [historial, setHistorial] = useState<HistorialRecord[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<HistorialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      const historialRes = await obtenerHistorial();
      const historialData = extractHistorial(historialRes.data);
      setHistorial(historialData);
      setFilteredHistorial(historialData);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los datos del historial.', 'error');
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
      String(h.id_historial).toLowerCase().includes(term) ||
      String(h.id_usuario).toLowerCase().includes(term) ||
      String(h.id_registro).toLowerCase().includes(term) ||
      (h.tabla_afectada && h.tabla_afectada.toLowerCase().includes(term)) ||
      (h.accion && h.accion.toLowerCase().includes(term)) ||
      (h.descripcion && h.descripcion.toLowerCase().includes(term))
    );
    setFilteredHistorial(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredHistorial(historial);
  };

  const borrarHistorial = async (h: HistorialRecord) => {
    const result = await Swal.fire({
      title: `¿Eliminar registro ${h.id_historial}?`,
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
      await eliminarHistorial(h.id_historial);
      await cargarDatosIniciales();
      Swal.fire({ title: 'Eliminado', icon: 'success', background: '#101010', color: '#f5f5f5', timer: 1500, showConfirmButton: false });
    } catch (err) {
      showAlert('Error', 'No se pudo eliminar el registro.', 'error');
    }
  };

  return (
    <div className="historial-page">
      <div className="admin-section">
        <h1 className="admin-title">Registro de Auditoría (Historial)</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por ID, tabla, acción o descripción"
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
                <th>ID Historial</th>
                <th>Usuario (Autor)</th>
                <th>Tabla Afectada</th>
                <th>ID Registro</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-row">Cargando historial...</td>
                </tr>
              ) : filteredHistorial.length > 0 ? (
                filteredHistorial.map((h) => (
                  <tr key={h.id_historial}>
                    <td className="orden-id"><FormattedId entity="historial" value={h.id_historial} /></td>
                    <td><FormattedId entity="usuario" value={h.id_usuario} /></td>
                    <td>{h.tabla_afectada}</td>
                    <td>{h.id_registro}</td>
                    <td>
                        <span className={`badge-accion ${h.accion?.toLowerCase()}`}>
                            {h.accion}
                        </span>
                    </td>
                    <td>{h.descripcion || '-'}</td>
                    <td>{h.fecha_registro ? new Date(h.fecha_registro).toLocaleString() : '-'}</td>
                    <td className="actions-cell">
                      <button className="btn-eliminar-ktm" onClick={() => borrarHistorial(h)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="loading-row">No hay registros en el historial.</td>
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