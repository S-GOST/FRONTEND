// src/components/TableHistorial/Historial.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerHistorial,
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
  const [filterAccion, setFilterAccion] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonModalData, setJsonModalData] = useState<{ antes: any; despues: any; accion: string } | null>(null);

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
    let filtered = [...historial];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        String(h.id_historial).toLowerCase().includes(term) ||
        String(h.id_usuario).toLowerCase().includes(term) ||
        String(h.id_registro).toLowerCase().includes(term) ||
        (h.tabla_afectada && h.tabla_afectada.toLowerCase().includes(term)) ||
        (h.descripcion && h.descripcion.toLowerCase().includes(term))
      );
    }

    if (filterAccion) {
      filtered = filtered.filter(h =>
        h.accion?.toUpperCase() === filterAccion.toUpperCase()
      );
    }

    setFilteredHistorial(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterAccion('');
    setFilteredHistorial(historial);
  };

  // Abrir modal con JSON de datos_antes y datos_despues
  const verDetalleJson = (h: HistorialRecord) => {
    const record = h as any;
    let antes = null;
    let despues = null;

    try {
      antes = record.datos_antes ? (typeof record.datos_antes === 'string' ? JSON.parse(record.datos_antes) : record.datos_antes) : null;
    } catch { antes = record.datos_antes; }
    try {
      despues = record.datos_despues ? (typeof record.datos_despues === 'string' ? JSON.parse(record.datos_despues) : record.datos_despues) : null;
    } catch { despues = record.datos_despues; }

    setJsonModalData({ antes, despues, accion: h.accion || 'N/A' });
    setShowJsonModal(true);
  };

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
        <h1 className="admin-title">Registro de Auditoría (Historial)</h1>

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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <th>ID</th>
                <th>Usuario</th>
                <th>Tabla Afectada</th>
                <th>ID Registro</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Detalle</th>
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
                    <td>{getAccionBadge(h.accion)}</td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.descripcion || '-'}
                    </td>
                    <td>{h.fecha_registro ? new Date(h.fecha_registro).toLocaleString() : '-'}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => verDetalleJson(h)}
                        title="Ver datos antes/después"
                        style={{
                          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                          border: 'none', color: '#fff', padding: '6px 12px',
                          borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem',
                          fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                      >
                        <i className="bi bi-code-slash"></i> JSON
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

      {/* Modal JSON — Datos Antes / Después */}
      {showJsonModal && jsonModalData && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999,
          }}
          onClick={() => setShowJsonModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e', borderRadius: '16px', padding: '24px',
              maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto',
              border: '1px solid #333',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-code-slash" style={{ color: 'var(--ktm-orange)' }}></i>
                Detalle de Operación ({jsonModalData.accion})
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
              >×</button>
            </div>

            {jsonModalData.antes && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#dc3545', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <i className="bi bi-arrow-left-circle"></i> Datos ANTES
                </h4>
                <pre style={{
                  background: '#0d0d1a', padding: '12px', borderRadius: '8px',
                  color: '#e0e0e0', fontSize: '0.8rem', overflow: 'auto', maxHeight: '200px',
                  border: '1px solid #333',
                }}>
                  {JSON.stringify(jsonModalData.antes, null, 2)}
                </pre>
              </div>
            )}

            {jsonModalData.despues && (
              <div>
                <h4 style={{ color: '#28a745', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <i className="bi bi-arrow-right-circle"></i> Datos DESPUÉS
                </h4>
                <pre style={{
                  background: '#0d0d1a', padding: '12px', borderRadius: '8px',
                  color: '#e0e0e0', fontSize: '0.8rem', overflow: 'auto', maxHeight: '200px',
                  border: '1px solid #333',
                }}>
                  {JSON.stringify(jsonModalData.despues, null, 2)}
                </pre>
              </div>
            )}

            {!jsonModalData.antes && !jsonModalData.despues && (
              <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                No hay datos JSON disponibles para esta operación.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TableHistorial;