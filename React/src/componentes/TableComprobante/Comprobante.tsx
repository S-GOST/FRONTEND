import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerComprobantes,
  type ComprobanteRecord,
} from '../../services/comprobanteService';
import { FormattedId } from '../../componentes/FormattedId';
import './Comprobante.css';

const extractComprobantes = (payload: unknown): ComprobanteRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.comprobantes)) return obj.comprobantes;
  }
  return [];
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
      const comprobantesRes = await obtenerComprobantes();
      const data = extractComprobantes(comprobantesRes.data);
      setComprobantes(data);
      setFilteredComprobantes(data);
    } catch (error) {
      console.error(error);
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
    const filtered = comprobantes.filter(c => {
      const id = String(c.id_comprobante).toLowerCase();
      const num = c.numero_comprobante?.toLowerCase() || '';
      const estado = c.estado?.toLowerCase() || '';
      return id.includes(term) || num.includes(term) || estado.includes(term);
    });
    setFilteredComprobantes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredComprobantes(comprobantes);
  };

  return (
    <div className="comprobantes-page">
      <div className="admin-section">
        <h1 className="admin-title">Historial de Comprobantes (Solo Lectura)</h1>
        
        <p style={{ color: '#aaa', marginBottom: '20px' }}>
          En esta sección puedes consultar todos los comprobantes que has generado y enviado.
        </p>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por número o estado"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}><i className="bi bi-search"></i></button>
          </div>
          <div className="right-actions">
            <button className="btn-reset" onClick={handleReset}><i className="bi bi-arrow-repeat"></i> Reset</button>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>N° Comprobante</th>
                <th>Fecha</th>
                <th>Orden</th>
                <th>Subtotal</th>
                <th>Total Pagado</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando...</td></tr>
              ) : filteredComprobantes.length > 0 ? (
                filteredComprobantes.map(comp => (
                  <tr key={String(comp.id_comprobante)}>
                    <td className="orden-id">
                      {comp.numero_comprobante || <FormattedId entity="comprobante" value={comp.id_comprobante} />}
                    </td>
                    <td>{new Date(comp.fecha).toLocaleDateString()}</td>
                    <td><FormattedId entity="orden" value={comp.id_orden} /></td>
                    <td>{formatMoneda(comp.subtotal)}</td>
                    <td>{formatMoneda(comp.total_pagar)}</td>
                    <td>{comp.metodo_pago || 'Efectivo'}</td>
                    <td>
                      <span className={`badge-${(comp.estado || 'pendiente').toLowerCase()}`}>
                        {comp.estado || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="loading-row">No hay comprobantes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TableComprobantes;