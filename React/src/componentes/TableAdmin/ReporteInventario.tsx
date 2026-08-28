import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { obtenerReporteInventario } from '../../services/informe.service';
import { obtenerCategoriasPorTipo, CategoriaPayload } from '../../services/categoria.service';
import { BackButton } from '../BackButton';
import './ReporteInventario.css';

// ==================== TIPOS ====================
interface AlertaStock {
  id: number;
  nombre: string;
  stock: number;
  minimo: number;
}

interface ProductoMasUsado {
  ID_PRODUCTOS: number;
  Nombre: string;
  total_usado: number;
}

interface ServicioMasUsado {
  ID_SERVICIOS: number;
  nombre: string;
  Precio: string | number;
  total_usado: number;
  total_generado: number;
}

interface InventarioData {
  total_venta: number;
  total_costo?: number;
  alertas_stock: AlertaStock[];
  masUsados: ProductoMasUsado[];
  masUsadosServicios: ServicioMasUsado[];
}

const getDefaultDates = () => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  return {
    inicio: hace30.toISOString().split('T')[0],
    fin: hoy.toISOString().split('T')[0]
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

// ==================== COMPONENTE ====================
const ReporteInventario: React.FC = () => {
  const defaults = getDefaultDates();
  const [fechaInicio, setFechaInicio] = useState(defaults.inicio);
  const [fechaFin, setFechaFin] = useState(defaults.fin);
  const [categoria, setCategoria] = useState('');
  const [categoriasProducto, setCategoriasProducto] = useState<CategoriaPayload[]>([]);
  const [categoriasServicio, setCategoriasServicio] = useState<CategoriaPayload[]>([]);
  
  const [data, setData] = useState<InventarioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [consultado, setConsultado] = useState(false);

  useEffect(() => {
    // Cargar categorias de PRODUCTO y SERVICIO
    const extract = (res: any) => {
      if (res.data && res.data.success) return res.data.data;
      if (Array.isArray(res.data)) return res.data;
      return [];
    };
    obtenerCategoriasPorTipo('PRODUCTO')
      .then(res => setCategoriasProducto(extract(res)))
      .catch(err => console.error("Error al cargar categorías producto", err));
    obtenerCategoriasPorTipo('SERVICIO')
      .then(res => setCategoriasServicio(extract(res)))
      .catch(err => console.error("Error al cargar categorías servicio", err));
  }, []);

  const handleGenerar = async () => {
    if (fechaInicio && fechaFin) {
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        Swal.fire('Fechas Inválidas', 'La "fecha desde" no puede ser mayor a la "fecha hasta".', 'warning');
        return;
      }
    } else if (fechaInicio || fechaFin) {
      Swal.fire('Campos Incompletos', 'Debes seleccionar ambas fechas para el rango.', 'warning');
      return;
    }

    setLoading(true);
    setConsultado(true);
    try {
      const res = await obtenerReporteInventario(fechaInicio, fechaFin, categoria);
      if (res.success) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setData(null);
      } else {
        Swal.fire('Error', err.response?.data?.message || 'Error al generar el reporte', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const noData = consultado && !loading && !data;

  return (
    <div className="inventario-page">
      {/* HEADER */}
      <div className="inventario-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <BackButton />
          <h1 style={{ margin: 0, borderBottom: 'none' }}><i className="bi bi-box-seam"></i> Inventario de Productos</h1>
        </div>
        <p>Análisis de uso, alertas de stock bajo y valorización.</p>
      </div>

      {/* FILTROS */}
      <div className="inventario-filters">
        <div className="filter-group">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categoriasProducto.length > 0 && (
              <optgroup label="📦 Productos">
                {categoriasProducto.map(c => (
                  <option key={`p-${c.ID_CATEGORIA}`} value={c.ID_CATEGORIA}>{c.nombre}</option>
                ))}
              </optgroup>
            )}
            {categoriasServicio.length > 0 && (
              <optgroup label="🔧 Servicios">
                {categoriasServicio.map(c => (
                  <option key={`s-${c.ID_CATEGORIA}`} value={c.ID_CATEGORIA}>{c.nombre}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="fecha-inicio">Uso Desde</label>
          <input
            id="fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="fecha-fin">Uso Hasta</label>
          <input
            id="fecha-fin"
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
          />
        </div>
        
        <button
          className="btn-generar"
          onClick={handleGenerar}
          disabled={loading}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          {loading ? 'Consultando...' : <><i className="bi bi-lightning-charge-fill"></i> Generar Reporte</>}
        </button>
      </div>

      {/* RESULTADOS */}
      {noData && (
        <div className="productividad-empty">
          <i className="bi bi-inbox"></i>
          <p>No hay productos registrados o que coincidan con los filtros.</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div className="inventario-kpis">
            <div className="kpi-card">
              <div className="kpi-value venta">{formatCurrency(data.total_venta)}</div>
              <div className="kpi-label">Ventas Generadas</div>
            </div>
            {data.total_costo !== undefined && categoria === '' && (
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(data.total_costo)}</div>
                <div className="kpi-label">Costos Generados</div>
              </div>
            )}
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: data.alertas_stock.length > 0 ? '#ef4444' : '#10b981' }}>
                {data.alertas_stock.length}
              </div>
              <div className="kpi-label">Alertas de Stock</div>
            </div>
          </div>

          {/* ALERTAS */}
          {data.alertas_stock.length > 0 ? (
             <div className="inventario-section alert-section">
                <h2><i className="bi bi-exclamation-triangle-fill"></i> Alertas: Stock Bajo o Agotado</h2>
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Stock Mínimo</th>
                      <th>Stock Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alertas_stock.map((alerta) => (
                      <tr key={alerta.id}>
                        <td>{alerta.nombre}</td>
                        <td>{alerta.minimo}</td>
                        <td><span className="badge-alerta">{alerta.stock}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          ) : (
            <div className="inventario-section" style={{ textAlign: 'center', color: '#10b981' }}>
               <h4><i className="bi bi-check-circle-fill"></i> No hay alertas de stock.</h4>
               <p>Todos los productos tienen stock suficiente.</p>
            </div>
          )}

          {/* TOP PRODUCTOS */}
          <div className="inventario-section">
            <h2><i className="bi bi-graph-up-arrow"></i> Productos Más Utilizados</h2>
            {data.masUsados.length > 0 ? (
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Utilizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.masUsados.map((prod) => (
                      <tr key={prod.ID_PRODUCTOS}>
                        <td>{prod.Nombre}</td>
                        <td><span className="badge-cantidad">{prod.total_usado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : (
                <p style={{ color: '#888' }}>No se han utilizado productos en este rango de fechas.</p>
            )}
          </div>

          {/* TOP SERVICIOS */}
          <div className="inventario-section">
            <h2><i className="bi bi-gear-wide-connected"></i> Servicios Más Utilizados</h2>
            {data.masUsadosServicios && data.masUsadosServicios.length > 0 ? (
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Precio Unitario</th>
                      <th>Cantidad Utilizada</th>
                      <th>Total Generado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.masUsadosServicios.map((srv) => (
                      <tr key={srv.ID_SERVICIOS}>
                        <td>{srv.nombre}</td>
                        <td>{formatCurrency(Number(srv.Precio) || 0)}</td>
                        <td><span className="badge-cantidad" style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.25)' }}>{srv.total_usado}</span></td>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(Number(srv.total_generado) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : (
                <p style={{ color: '#888' }}>No se han utilizado servicios en este rango de fechas.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReporteInventario;
