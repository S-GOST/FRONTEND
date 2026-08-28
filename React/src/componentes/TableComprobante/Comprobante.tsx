import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  obtenerComprobantes,
  obtenerMisComprobantes,
  type ComprobanteRecord,
} from '../../services/comprobanteService';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
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
  const [filterFecha, setFilterFecha] = useState('');

  const userRole = localStorage.getItem('user_role');

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

      let data: ComprobanteRecord[] = [];

      // CA-001: Si es cliente, solo ve sus propios comprobantes
      if (userRole === 'cliente') {
        const res = await obtenerMisComprobantes();
        data = extractComprobantes(res);
      } else {
        const comprobantesRes = await obtenerComprobantes();
        data = extractComprobantes(comprobantesRes.data);
      }

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
    let filtered = [...comprobantes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const id = String(c.id_comprobante).toLowerCase();
        const num = c.numero_comprobante?.toLowerCase() || '';
        const estado = c.estado?.toLowerCase() || '';
        const metodo = c.metodo_pago?.toLowerCase() || '';
        return id.includes(term) || num.includes(term) || estado.includes(term) || metodo.includes(term);
      });
    }

    // CP-161: Filtrar por fecha
    if (filterFecha) {
      filtered = filtered.filter(c => {
        const fechaComp = new Date(c.fecha).toISOString().split('T')[0];
        return fechaComp === filterFecha;
      });
    }

    setFilteredComprobantes(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterFecha('');
    setFilteredComprobantes(comprobantes);
  };

  // CA-002: Generar y descargar PDF del comprobante
  const descargarPDF = (comp: ComprobanteRecord) => {
    try {
      const doc = new jsPDF();

      // === Encabezado ===
      doc.setFillColor(255, 102, 0); // Naranja KTM
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('KTM Rocket Service', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprobante de Pago', 14, 30);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 145, 30);

      // === Datos del comprobante ===
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalles del Comprobante', 14, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const startY = 65;
      const lineHeight = 8;

      const detalles = [
        ['N° Comprobante:', comp.numero_comprobante || `COMP-${comp.id_comprobante}`],
        ['Fecha:', new Date(comp.fecha).toLocaleDateString('es-CO')],
        ['N° Orden:', `ORD-${comp.id_orden}`],
        ['Método de Pago:', comp.metodo_pago || 'Efectivo'],
        ['Estado:', comp.estado || 'Pendiente'],
      ];

      detalles.forEach(([label, value], i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, startY + i * lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 65, startY + i * lineHeight);
      });

      // === Tabla de montos ===
      autoTable(doc, {
        startY: startY + detalles.length * lineHeight + 10,
        head: [['Concepto', 'Valor']],
        body: [
          ['Subtotal', formatMoneda(comp.subtotal)],
          ['Total a Pagar', formatMoneda(comp.total_pagar)],
        ],
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [255, 102, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        theme: 'grid',
      });

      // === Pie de página ===
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(40, 40, 40);
      doc.rect(0, pageHeight - 25, 210, 25, 'F');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      doc.text('Este comprobante es de solo lectura y tiene validez como soporte de pago.', 14, pageHeight - 14);
      doc.text('KTM Rocket Service © 2026 | Todos los derechos reservados', 14, pageHeight - 8);

      // Descargar
      const fileName = `Comprobante_${comp.numero_comprobante || comp.id_comprobante}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: '¡PDF Descargado!',
        text: `Se descargó ${fileName}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#101010',
        color: '#f5f5f5',
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      showAlert('Error', 'No se pudo generar el PDF del comprobante.', 'error');
    }
  };

  return (
    <div className="comprobantes-page">
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton />
          <h1 className="admin-title" style={{ margin: 0, borderBottom: 'none' }}>Historial de Comprobantes (Solo Lectura)</h1>
        </div>

        <p style={{ color: '#aaa', marginBottom: '20px' }}>
          {userRole === 'cliente'
            ? 'Aquí puedes consultar y descargar los comprobantes asociados a tus motos.'
            : 'En esta sección puedes consultar todos los comprobantes que has generado y enviado.'}
        </p>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por número, estado o método"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="date"
              className="search-input"
              style={{ maxWidth: '180px' }}
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="loading-row">Cargando...</td></tr>
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
                    <td className="actions-cell">
                      <button
                        className="btn-descargar-pdf"
                        onClick={() => descargarPDF(comp)}
                        title="Descargar PDF"
                        style={{
                          background: 'linear-gradient(135deg, #ff6600, #ff8533)',
                          border: 'none',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <i className="bi bi-file-earmark-pdf"></i> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="loading-row">No se encontraron comprobantes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TableComprobantes;