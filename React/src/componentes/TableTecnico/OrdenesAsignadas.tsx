import React, { useState } from 'react';
import { type OrdenServicioRecord } from '../../services/ordenServicioService';
import { type ClienteRecord } from '../../services/cliente.service';

export interface OrdenUI extends OrdenServicioRecord {
  ClienteNombre: string;
}

export interface ClienteUI extends ClienteRecord {
  ID_CLIENTES: string | number;
  Nombre: string;
  Telefono: string;
  Correo: string;
  Ubicacion: string;
}

interface OrdenesActivasProps {
  ordenes: OrdenUI[];
  onActualizarEstado: (id: string, estado: string) => void;
  onAbrirInforme: (orden: OrdenUI) => void;
  onVerDetalle: (orden: OrdenUI) => void;
  getEstadoConfig: (estado: string) => { class: string; icon: string; label: string; next: string };
  formatDate: (d: string | null | undefined) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatId: (tipo: string, id: any) => string;
}

export const OrdenesAsignadas: React.FC<OrdenesActivasProps> = ({
  ordenes,
  onActualizarEstado,
  onAbrirInforme,
  onVerDetalle,
  getEstadoConfig,
  formatDate,
  formatId
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'Pendiente' | 'En Proceso' | 'Completado'>('todas');
  const [busqueda, setBusqueda] = useState('');

  const ordenesFiltradas = ordenes.filter(o => {
    const estadoL = o.Estado?.toLowerCase() || '';
    let matchEstado = false;
    
    if (filtroEstado === 'todas') {
      matchEstado = true;
    } else if (filtroEstado === 'Completado') {
      matchEstado = estadoL.includes('finalizad') || estadoL.includes('completad');
    } else {
      matchEstado = estadoL.includes(filtroEstado.toLowerCase());
    }

    const matchBusqueda = busqueda === '' ||
      o.ClienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(o.ID_ORDEN_SERVICIO).includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  const countByState = (estado: string) =>
    ordenes.filter(o => o.Estado?.toLowerCase().includes(estado.toLowerCase())).length;

  return (
    <div className="ordenes-panel">
      {/* Resumen rápido */}
      <div className="ordenes-resumen">
        <div className="resumen-chip chip-all" role="button" tabIndex={0} onClick={() => setFiltroEstado('todas')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltroEstado('todas'); } }}>
          <span className="chip-num">{ordenes.length}</span>
          <span className="chip-lbl">Total</span>
        </div>

        <div className="resumen-chip chip-process" role="button" tabIndex={0} onClick={() => setFiltroEstado('En Proceso')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltroEstado('En Proceso'); } }}>
          <i className="bi bi-arrow-repeat"></i>
          <span className="chip-num">{countByState('proceso')}</span>
          <span className="chip-lbl">En Proceso</span>
        </div>
        <div className="resumen-chip chip-done" role="button" tabIndex={0} onClick={() => setFiltroEstado('Completado')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltroEstado('Completado'); } }}>
          <i className="bi bi-check-circle"></i>
          <span className="chip-num">{countByState('finalizada') + countByState('completado')}</span>
          <span className="chip-lbl">Finalizadas</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="ordenes-search-bar">
        <i className="bi bi-search"></i>
        <input
          type="text"
          placeholder="Buscar por cliente o número de orden..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="clear-search">
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>

      {/* Tarjetas de órdenes */}
      {ordenesFiltradas.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#333' }}></i>
          <p style={{ color: '#555', marginTop: '1rem' }}>
            {ordenes.length === 0
              ? 'No tienes órdenes asignadas aún.'
              : 'Sin órdenes que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="ordenes-cards-grid">
          {ordenesFiltradas.map(orden => {
            const cfg = getEstadoConfig(orden.Estado);
            const esPendiente = cfg.label === 'Pendiente';
            const esEnProceso = cfg.label === 'En Proceso';
            const esCompletada = cfg.label === 'Finalizada' || cfg.label === 'Cancelada';

            return (
              <div key={orden.ID_ORDEN_SERVICIO} className={`orden-card ${cfg.class}`}>
                {/* Cabecera */}
                <div className="orden-card-header">
                  <div className="orden-card-id">
                    <i className="bi bi-tools"></i>
                    {formatId('orden', orden.ID_ORDEN_SERVICIO)}
                  </div>
                  <span className={`estado-badge ${cfg.class}`}>
                    <i className={`bi ${cfg.icon}`}></i> {cfg.label}
                  </span>
                </div>

                {/* Información */}
                <div className="orden-card-body">
                  <div className="orden-card-info">
                    <div className="info-item">
                      <i className="bi bi-person-fill"></i>
                      <span>{orden.ClienteNombre}</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-bicycle"></i>
                      <span>{orden.ID_MOTOS ? formatId('moto', orden.ID_MOTOS) : 'Sin moto asignada'}</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-calendar-event"></i>
                      <span>Ingreso: {formatDate(orden.Fecha_inicio)}</span>
                    </div>
                    {orden.Fecha_estimada && (
                      <div className="info-item">
                        <i className="bi bi-calendar-check"></i>
                        <span>Estimada: {formatDate(orden.Fecha_estimada)}</span>
                      </div>
                    )}
                    {orden.total && (
                      <div className="info-item info-total">
                        <i className="bi bi-currency-dollar"></i>
                        <span>${Number(orden.total).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>

                  {orden.observaciones && (
                    <div className="orden-card-obs">
                      <i className="bi bi-chat-left-text"></i>
                      <span>{orden.observaciones}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                {!esCompletada && (
                  <div className="orden-card-actions">
                    {esPendiente && (
                      <>
                        <button
                          className="card-btn btn-iniciar"
                          onClick={() => onActualizarEstado(String(orden.ID_ORDEN_SERVICIO), 'En proceso')}
                        >
                          <i className="bi bi-play-circle-fill"></i> Iniciar Trabajo
                        </button>
                      </>
                    )}
                    {esEnProceso && (
                      <>
                        <button
                          className="card-btn btn-informe"
                          onClick={() => onAbrirInforme(orden)}
                          style={{ width: '100%' }}
                        >
                          <i className="bi bi-file-earmark-plus-fill"></i> Redactar Informe
                        </button>
                      </>
                    )}
                    <button
                      className="card-btn btn-detalle-sm"
                      onClick={() => onVerDetalle(orden)}
                    >
                      <i className="bi bi-eye-fill"></i> Detalles
                    </button>
                  </div>
                )}
                {esCompletada && (
                  <div className="orden-card-actions">
                    <button
                      className="card-btn btn-detalle-sm"
                      onClick={() => onVerDetalle(orden)}
                    >
                      <i className="bi bi-eye-fill"></i> Ver Detalles
                    </button>
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
