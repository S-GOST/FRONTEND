import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { obtenerReporteProductividad } from '../../services/informe.service';
import { BackButton } from '../BackButton';
import './Productividad.css';

// ==================== TIPOS ====================
interface OrdenCompletada {
  id_usuario: number;
  nombre: string;
  total_completadas: number;
}

interface PromedioServicio {
  id_usuario: number;
  nombre: string;
  servicio: string;
  promedio_minutos: number;
}

interface ProductividadData {
  ordenesCompletadas: OrdenCompletada[];
  promediosServicios: PromedioServicio[];
}

// ==================== HELPERS ====================
const formatTiempo = (minutos: number): string => {
  if (!minutos || minutos <= 0) return '—';
  const hrs = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  if (hrs === 0) return `${mins} min`;
  return `${hrs}h ${mins}m`;
};

const getDefaultDates = () => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  return {
    inicio: hace30.toISOString().split('T')[0],
    fin: hoy.toISOString().split('T')[0]
  };
};

// ==================== COMPONENTE ====================
const Productividad: React.FC = () => {
  const defaults = getDefaultDates();
  const [fechaInicio, setFechaInicio] = useState(defaults.inicio);
  const [fechaFin, setFechaFin] = useState(defaults.fin);
  const [data, setData] = useState<ProductividadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [consultado, setConsultado] = useState(false);

  const handleGenerar = async () => {
    if (!fechaInicio || !fechaFin) {
      Swal.fire('Atención', 'Seleccione ambas fechas.', 'warning');
      return;
    }
    if (fechaInicio > fechaFin) {
      Swal.fire('Atención', 'La fecha de inicio no puede ser mayor a la fecha fin.', 'warning');
      return;
    }

    setLoading(true);
    setConsultado(true);
    try {
      const res = await obtenerReporteProductividad(fechaInicio, fechaFin);
      if (res.success) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setData(null);
      } else {
        Swal.fire('Error', err.response?.data?.message || 'No se pudo generar el reporte', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const totalOrdenes = data?.ordenesCompletadas?.reduce((acc, t) => acc + t.total_completadas, 0) || 0;
  const totalTecnicos = data?.ordenesCompletadas?.length || 0;
  const promedioGeneral = data?.promediosServicios?.length
    ? data.promediosServicios.reduce((acc, s) => acc + s.promedio_minutos, 0) / data.promediosServicios.length
    : 0;

  const noData = consultado && !loading && (!data || (data.ordenesCompletadas.length === 0 && data.promediosServicios.length === 0));

  return (
    <div className="productividad-page">
      {/* HEADER */}
      <div className="productividad-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <BackButton />
          <h1 style={{ margin: 0, borderBottom: 'none' }}><i className="bi bi-graph-up-arrow"></i> Productividad de Técnicos</h1>
        </div>
        <p>Analice el rendimiento de sus técnicos por período y tipo de servicio.</p>
      </div>

      {/* FILTROS */}
      <div className="productividad-filters">
        <div className="filter-group">
          <label htmlFor="fecha-inicio">Desde</label>
          <input
            id="fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="fecha-fin">Hasta</label>
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
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              Consultando...
            </>
          ) : (
            <>
              <i className="bi bi-lightning-charge-fill"></i>
              Generar Reporte
            </>
          )}
        </button>
      </div>

      {/* LOADER */}
      {loading && (
        <div className="productividad-loader">
          <div className="spinner"></div>
          <span>Calculando métricas de productividad...</span>
        </div>
      )}

      {/* SIN DATOS */}
      {noData && (
        <div className="productividad-empty">
          <i className="bi bi-inbox"></i>
          <p>No hay órdenes completadas en el período seleccionado.</p>
        </div>
      )}

      {/* RESULTADOS */}
      {data && !loading && (data.ordenesCompletadas.length > 0 || data.promediosServicios.length > 0) && (
        <>
          {/* KPIs */}
          <div className="productividad-kpis">
            <div className="kpi-card">
              <div className="kpi-value">{totalOrdenes}</div>
              <div className="kpi-label">Órdenes Completadas</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalTecnicos}</div>
              <div className="kpi-label">Técnicos Activos</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{formatTiempo(promedioGeneral)}</div>
              <div className="kpi-label">Tiempo Promedio</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{data.promediosServicios.length}</div>
              <div className="kpi-label">Tipos de Servicio</div>
            </div>
          </div>

          {/* TABLA 1: Órdenes por técnico */}
          {data.ordenesCompletadas.length > 0 && (
            <div className="productividad-section">
              <h2><i className="bi bi-bar-chart-fill"></i> Órdenes Completadas por Técnico</h2>
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>Técnico</th>
                    <th>Órdenes Completadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ordenesCompletadas.map((t) => (
                    <tr key={t.id_usuario}>
                      <td>{t.nombre}</td>
                      <td><span className="badge-cantidad">{t.total_completadas}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA 2: Tiempo promedio por servicio y técnico */}
          {data.promediosServicios.length > 0 && (
            <div className="productividad-section">
              <h2><i className="bi bi-stopwatch-fill"></i> Tiempo Promedio por Servicio</h2>
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>Técnico</th>
                    <th>Servicio</th>
                    <th>Tiempo Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.promediosServicios.map((s, i) => (
                    <tr key={`${s.id_usuario}-${s.servicio}-${i}`}>
                      <td>{s.nombre}</td>
                      <td>{s.servicio}</td>
                      <td><span className="badge-tiempo"><i className="bi bi-clock"></i> {formatTiempo(s.promedio_minutos)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Productividad;
