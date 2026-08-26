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
