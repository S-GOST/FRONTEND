import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { obtenerMiHistorial, type HistorialRecord } from '../../services/historial.service';
import './ClienteHistorial.css';

const ClienteHistorial = () => {
  const [historial, setHistorial] = useState<HistorialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await obtenerMiHistorial();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setHistorial(data);
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar tu historial',
          icon: 'error',
          background: '#101010',
          color: '#f5f5f5'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  const getBadgeClass = (accion: string): string => {
    if (!accion) return '';
    const a = accion.toLowerCase();
    if (a.includes('pago') || a.includes('pagó')) return 'pago';
    if (a.includes('creac') || a.includes('inserc')) return 'creacion';
    if (a.includes('modific') || a.includes('actualiz')) return 'modificacion';
    if (a.includes('elimin')) return 'eliminacion';
    return '';
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="cliente-historial-page">
      <h1 className="cliente-historial-title">
        <i className="bi bi-journal-text" style={{ marginRight: '10px' }}></i>{' '}
        Mi Historial
      </h1>

      {loading ? (
        <div className="historial-empty">
          <p>Cargando historial...</p>
        </div>
      ) : historial.length === 0 ? (
        <div className="historial-empty">
          <i className="bi bi-clock-history"></i>
          <p>Aún no tienes actividad registrada en el sistema.</p>
        </div>
      ) : (
        <div className="historial-table-container">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Tabla</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <tr key={item.id_historial}>
                  <td>
                    <span className="historial-fecha">
                      {formatFecha(item.fecha_registro || '')}
                    </span>
                  </td>
                  <td>
                    <span className={`historial-badge ${getBadgeClass(item.accion)}`}>
                      {item.accion}
                    </span>
                  </td>
                  <td>{item.tabla_afectada || '—'}</td>
                  <td>
                    <span className="historial-descripcion" title={item.descripcion}>
                      {item.descripcion || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClienteHistorial;
