import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMisOrdenes } from '../../services/ordenServicioService';
import '../TableOrdenServicios/OrdenesServicio.css';

interface DetalleOrden {
  id_detalle: number;
  ID_SERVICIOS: number | null;
  ID_PRODUCTOS: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  garantia?: number | null;
  NombreServicio: string | null;
  NombreProducto: string | null;
}

interface OrdenCliente {
  ID_ORDEN_SERVICIO: number;
  ID_CLIENTES: number;
  ID_MOTOS: number;
  Fecha_inicio: string;
  Fecha_estimada: string | null;
  Fecha_fin: string | null;
  Estado: string;
  total: number;
  PlacaMoto: string | null;
  MarcaMoto: string | null;
  ModeloMoto: string | null;
  detalles: DetalleOrden[];
}

const getEstadoColor = (estado: string): string => {
  const e = estado.toLowerCase();
  if (e === 'completado') return '#00ff88';
  if (e === 'en proceso') return '#ffd166';
  if (e === 'pendiente') return '#ff6600';
  if (e === 'cancelado') return '#ff4444';
  return '#888';
};

const getEstadoIcon = (estado: string): string => {
  const e = estado.toLowerCase();
  if (e === 'completado') return 'bi-check-circle-fill';
  if (e === 'en proceso') return 'bi-gear-fill';
  if (e === 'pendiente') return 'bi-clock-fill';
  if (e === 'cancelado') return 'bi-x-circle-fill';
  return 'bi-question-circle';
};

const formatFecha = (fecha: string | null): string => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatPrecio = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(valor);
};

const ClienteOrdenes = () => {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState<OrdenCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const res = await obtenerMisOrdenes();
      const data = res.data?.data || res.data || [];
      setOrdenes(Array.isArray(data) ? data : []);
      setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error al cargar órdenes:', err);
      setError('No se pudieron cargar tus órdenes. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetalles = (id: number) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <i className="bi bi-hourglass-split" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px', color: '#ff6600' }}></i>
          <p style={{ fontSize: '1.1rem' }}>Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 700 }}>
            <i className="bi bi-clipboard-check" style={{ color: '#ff6600', marginRight: '10px' }}></i>{' '}
            Mis Órdenes de Servicio
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
            {ordenes.length} {ordenes.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/cliente/dashboard')}
          style={{
            background: 'transparent', border: '2px solid #ff6600', color: '#ff6600',
            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s',
            fontSize: '0.9rem'
          }}
        >
          <i className="bi bi-arrow-left"></i> Volver al Panel
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#2a1010', border: '1px solid #ff444440', borderRadius: '10px', 
          padding: '16px', marginBottom: '20px', color: '#ff6666', display: 'flex', 
          alignItems: 'center', gap: '10px'
        }}>
          <i className="bi bi-exclamation-triangle-fill"></i> {error}
          <button onClick={cargarOrdenes} style={{ 
            marginLeft: 'auto', background: '#ff6600', border: 'none', color: '#fff', 
            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 
          }}>
            Reintentar
          </button>
        </div>
      )}

      {ordenes.length === 0 && !error ? (
        <div style={{ 
          textAlign: 'center', padding: '60px 20px', background: '#1a1a1a', 
          borderRadius: '16px', border: '1px solid #333'
        }}>
          <i className="bi bi-inbox" style={{ fontSize: '3.5rem', color: '#444', display: 'block', marginBottom: '16px' }}></i>
          <p style={{ color: '#888', fontSize: '1.1rem', margin: 0 }}>No tienes órdenes de servicio registradas.</p>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px' }}>
            Agrega servicios al carrito para crear tu primera orden.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ordenes.map((orden) => {
            const color = getEstadoColor(orden.Estado);
            const icon = getEstadoIcon(orden.Estado);
            const isExpanded = expandedOrder === orden.ID_ORDEN_SERVICIO;
            const servicios = orden.detalles?.filter(d => d.ID_SERVICIOS) || [];
            const productos = orden.detalles?.filter(d => d.ID_PRODUCTOS) || [];

            return (
              <div key={orden.ID_ORDEN_SERVICIO} style={{ 
                background: '#1a1a1a', borderRadius: '14px', border: '1px solid #333',
                overflow: 'hidden', transition: 'all 0.3s',
                boxShadow: isExpanded ? '0 8px 30px rgba(255,102,0,0.1)' : '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                {/* Fila principal de la orden */}
                <div onClick={() => toggleDetalles(orden.ID_ORDEN_SERVICIO)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toggleDetalles(orden.ID_ORDEN_SERVICIO); } }}
                  style={{ 
                    padding: '20px 24px', cursor: 'pointer',
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr 1fr 1fr auto auto',
                    alignItems: 'center', gap: '20px',
                    borderBottom: isExpanded ? '1px solid #333' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
                  onFocus={(e) => (e.currentTarget.style.background = '#222')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      background: '#ff660020', color: '#ff6600', padding: '6px 12px', 
                      borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      #{String(orden.ID_ORDEN_SERVICIO).padStart(4, '0')}
                    </span>
                  </div>

                  {/* Moto */}
                  <div>
                    <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Moto</span>
                    <span style={{ color: '#ddd', fontWeight: 600, fontSize: '0.95rem' }}>
                      {orden.MarcaMoto && orden.ModeloMoto 
                        ? `${orden.MarcaMoto} ${orden.ModeloMoto}` 
                        : orden.PlacaMoto || '—'}
                    </span>
                    {orden.PlacaMoto && orden.MarcaMoto && (
                      <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '8px' }}>({orden.PlacaMoto})</span>
                    )}
                  </div>

                  {/* Fechas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Fechas</span>
                    <span style={{ color: '#ddd', fontSize: '0.9rem' }}>
                      <i className="bi bi-calendar-event" style={{ marginRight: '6px', color: '#888' }}></i>
                      {formatFecha(orden.Fecha_inicio)}
                    </span>
                    {orden.Fecha_estimada && (
                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                        <i className="bi bi-calendar-check" style={{ marginRight: '6px', color: '#aaa' }}></i>
                        Est: {formatFecha(orden.Fecha_estimada)}
                      </span>
                    )}
                    {orden.Fecha_fin && (
                      <span style={{ color: '#00ff88', fontSize: '0.85rem' }}>
                        <i className="bi bi-calendar-check-fill" style={{ marginRight: '6px', color: '#00ff88' }}></i>
                        Fin: {formatFecha(orden.Fecha_fin)}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div>
                    <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Total</span>
                    <span style={{ color: '#ff6600', fontWeight: 700, fontSize: '1.05rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatPrecio(orden.total || 0)}
                    </span>
                  </div>

                  {/* Estado */}
                  <span style={{ 
                    padding: '6px 14px', borderRadius: '20px', 
                    backgroundColor: `${color}15`, color: color, 
                    fontWeight: 700, fontSize: '0.8rem', 
                    border: `1px solid ${color}40`,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap'
                  }}>
                    <i className={`bi ${icon}`}></i>
                    {orden.Estado}
                  </span>

                  {/* Flecha expandir */}
                  <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} 
                    style={{ color: '#888', fontSize: '1.2rem', transition: 'transform 0.3s' }}></i>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px', background: '#141414' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <h4 style={{ color: '#ff6600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                          <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>Información
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                          <span style={{ color: '#888' }}>Fecha inicio: <span style={{ color: '#ddd' }}>{formatFecha(orden.Fecha_inicio)}</span></span>
                          <span style={{ color: '#888' }}>Fecha estimada: <span style={{ color: '#ddd' }}>{formatFecha(orden.Fecha_estimada)}</span></span>
                          <span style={{ color: '#888' }}>Fecha fin: <span style={{ color: '#ddd' }}>{formatFecha(orden.Fecha_fin)}</span></span>
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: '#ff6600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                          <i className="bi bi-bicycle" style={{ marginRight: '6px' }}></i>Moto
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                          <span style={{ color: '#888' }}>Placa: <span style={{ color: '#ddd' }}>{orden.PlacaMoto || '—'}</span></span>
                          <span style={{ color: '#888' }}>Marca: <span style={{ color: '#ddd' }}>{orden.MarcaMoto || '—'}</span></span>
                          <span style={{ color: '#888' }}>Modelo: <span style={{ color: '#ddd' }}>{orden.ModeloMoto || '—'}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de detalles */}
                    {(servicios.length > 0 || productos.length > 0) && (
                      <div>
                        <h4 style={{ color: '#ff6600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                          <i className="bi bi-list-check" style={{ marginRight: '6px' }}></i>Detalle de la orden
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #333' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cant.</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Garantía</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>P. Unitario</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', color: '#ff6600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orden.detalles.map((det) => (
                              <tr key={det.id_detalle} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{ 
                                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                    background: det.ID_SERVICIOS && det.ID_PRODUCTOS ? '#ff00ff20' : det.ID_SERVICIOS ? '#ff660020' : '#0088ff20',
                                    color: det.ID_SERVICIOS && det.ID_PRODUCTOS ? '#ff00ff' : det.ID_SERVICIOS ? '#ff6600' : '#0088ff'
                                  }}>
                                    {[det.ID_SERVICIOS ? 'Servicio' : null, det.ID_PRODUCTOS ? 'Producto' : null].filter(Boolean).join(' + ')}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#ddd', fontWeight: 500 }}>
                                  {[det.NombreServicio, det.NombreProducto].filter(Boolean).join(' + ') || '—'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ccc' }}>{det.cantidad}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>
                                  {det.garantia ? `${det.garantia} días` : '—'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ccc', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {formatPrecio(det.precio_unitario)}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#fff', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                                  {formatPrecio(det.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #ff660040' }}>
                              <td colSpan={4} style={{ padding: '12px', textAlign: 'right', color: '#ff6600', fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase' }}>
                                Total
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#ff6600', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                {formatPrecio(orden.total || orden.detalles.reduce((sum, d) => sum + d.subtotal, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClienteOrdenes;
