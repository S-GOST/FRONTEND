import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { obtenerMisComprobantes, pagarComprobante } from '../../services/comprobanteService';
import { FormattedId } from '../../componentes/FormattedId';
import './ClienteComprobantes.css';

const ClienteComprobantes = () => {
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComprobantes = async () => {
      try {
        const res = await obtenerMisComprobantes();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setComprobantes(data);
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los comprobantes',
          icon: 'error',
          background: '#101010',
          color: '#f5f5f5'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchComprobantes();
  }, []);

  const handlePagar = async (id: string | number) => {
    const { value: metodoPago } = await Swal.fire({
      title: 'Seleccione método de pago',
      html: `
        <div style="text-align:left; margin-top:1rem; width: 100%; box-sizing: border-box;">
          <label style="display:block; color:#aaa; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem; text-transform:uppercase;">
            Método de pago
          </label>
          <select id="swal-metodo-pago" style="
            width:100%; 
            padding:1rem; 
            background:#1a1a1a; 
            border:1px solid #333;
            border-radius:8px; 
            color:#fff; 
            font-size:1rem; 
            cursor:pointer;
            box-sizing: border-box;
            outline: none;
          ">
            <option value="">-- Seleccione --</option>
            <option value="Efectivo">💵 Efectivo</option>
            <option value="Tarjeta">💳 Tarjeta de crédito/débito</option>
            <option value="Transferencia">🏦 Transferencia bancaria</option>
            <option value="Nequi">📱 Nequi</option>
            <option value="Daviplata">📲 Daviplata</option>
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#555',
      confirmButtonText: 'Confirmar pago',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
      preConfirm: () => {
        const select = document.getElementById('swal-metodo-pago') as HTMLSelectElement;
        if (!select?.value) {
          Swal.showValidationMessage('Debe seleccionar un método de pago');
          return false;
        }
        return select.value;
      }
    });

    if (metodoPago) {
      try {
        setLoading(true);
        await pagarComprobante(id, metodoPago);
        
        Swal.fire({
          title: '¡Pagado!',
          text: `Comprobante pagado exitosamente con ${metodoPago}.`,
          icon: 'success',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5'
        });

        // Recargar comprobantes
        const res = await obtenerMisComprobantes();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setComprobantes(data);
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al intentar procesar el pago.',
          icon: 'error',
          confirmButtonColor: '#ff6600',
          background: '#101010',
          color: '#f5f5f5'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDescargar = (comp: any) => {
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Comprobante ${comp.numero_comprobante || comp.id_comprobante}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
            .receipt { max-width: 400px; margin: 0 auto; border: 1px dashed #ccc; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #555; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 20px; text-align: right; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">TALLER KTM</div>
              <div class="subtitle">Comprobante de Servicio</div>
            </div>
            
            <div class="row">
              <span class="label">N° Comprobante:</span>
              <span>${comp.numero_comprobante || comp.id_comprobante}</span>
            </div>
            <div class="row">
              <span class="label">Fecha:</span>
              <span>${new Date(comp.fecha).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">Orden:</span>
              <span>ORD-${comp.id_orden.toString().padStart(4, '0')}</span>
            </div>
            <div class="row">
              <span class="label">Ingreso Moto:</span>
              <span>${comp.fecha_ingreso ? new Date(comp.fecha_ingreso).toLocaleDateString() : '—'}</span>
            </div>
            <div class="row">
              <span class="label">Método Pago:</span>
              <span>${comp.metodo_pago || '—'}</span>
            </div>
            
            <div style="margin-top: 20px;">
              <div class="label">Diagnóstico:</div>
              <div style="margin-top: 5px; font-size: 14px;">${comp.diagnostico || '—'}</div>
            </div>
            
            <div style="margin-top: 15px;">
              <div class="label">Trabajo Realizado:</div>
              <div style="margin-top: 5px; font-size: 14px;">${comp.trabajo_realizado || '—'}</div>
            </div>

            <div class="row" style="margin-top: 15px;">
              <span class="label">Estado:</span>
              <span style="text-transform: uppercase;">${comp.estado || 'Pendiente'}</span>
            </div>
            
            <div class="total">
              Total: $${Number(comp.total_pagar || 0).toLocaleString()}
            </div>
            
            <div class="footer">
              ¡Gracias por confiar en nosotros!<br>
              Taller Especializado KTM
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="cliente-comprobantes-page">
      <h1 className="cliente-comprobantes-title">Mis Comprobantes</h1>

      {loading ? (
        <div className="no-data">Cargando comprobantes...</div>
      ) : comprobantes.length === 0 ? (
        <div className="no-data">No tienes comprobantes registrados.</div>
      ) : (
        <div className="comprobantes-grid">
          {comprobantes.map(comp => (
            <div key={comp.id_comprobante} className="comprobante-card">
              <div className="comprobante-header">
                <span className="comprobante-id">
                  {comp.numero_comprobante || <FormattedId entity="comprobante" value={comp.id_comprobante} />}
                </span>
                <span className="comprobante-fecha">
                  {new Date(comp.fecha).toLocaleDateString()}
                </span>
              </div>
              
              <div className="comprobante-body">
                <div className="comprobante-info">
                  <strong>Orden:</strong> <FormattedId entity="orden" value={comp.id_orden} />
                </div>
                <div className="comprobante-info">
                  <strong>Ingreso Moto:</strong> {comp.fecha_ingreso ? new Date(comp.fecha_ingreso).toLocaleDateString() : '—'}
                </div>
                <div className="comprobante-info">
                  <strong>Método de Pago:</strong> {comp.metodo_pago || '—'}
                </div>
                {comp.diagnostico && (
                  <div className="comprobante-info">
                    <strong>Diagnóstico:</strong> {comp.diagnostico}
                  </div>
                )}
                {comp.trabajo_realizado && (
                  <div className="comprobante-info">
                    <strong>Trabajo:</strong> {comp.trabajo_realizado}
                  </div>
                )}
              </div>

              <div className="comprobante-footer">
                <span className="comprobante-monto">${Number(comp.total_pagar || 0).toLocaleString()}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    className="action-btn"
                    style={{ background: 'transparent', border: '1px solid #ff6600', color: '#ff6600', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => handleDescargar(comp)}
                    title="Descargar / Imprimir"
                  >
                    <i className="bi bi-download"></i> Descargar
                  </button>
                  {(!comp.estado || comp.estado.toLowerCase() === 'pendiente') && (
                    <button 
                      className="action-btn action-btn-primary" 
                      onClick={() => handlePagar(comp.id_comprobante)}
                    >
                      Pagar
                    </button>
                  )}
                  <span className={`badge-estado ${(comp.estado || 'pendiente').toLowerCase()}`}>
                    {comp.estado || 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClienteComprobantes;
