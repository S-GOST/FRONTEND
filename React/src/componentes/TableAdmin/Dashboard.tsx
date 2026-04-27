import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerAdmins } from '../../services/admin.service';
import { obtenerTecnicos } from '../../services/tecnico.service';
import { obtenerClientes } from '../../services/cliente.service';
import { obtenerOrdenes, actualizarOrden } from '../../services/ordenServicioService';
import { clearSession } from '../../services/auth.services';
import './Dashboard.css';

// ==================== TIPOS ====================
interface AdminStats {
  usuarios: number;
  tecnicos: number;
  clientes: number;
  ordenesPendientes: number;
  ordenesEnProceso: number;
  ordenesCompletadas: number;
}

interface OpcionAsignacion {
  id: string;
  nombre: string;
}

// ==================== EXTRACTION HELPER ====================
const extraerDatos = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const found = obj.data || obj.admins || obj.tecnicos || obj.clientes || obj.ordenes;
    return Array.isArray(found) ? found as T[] : [];
  }
  return [];
};

// ==================== COMPONENTE ====================
function Dashboard() {
  const navigate = useNavigate();
  const adminNombre = localStorage.getItem('user_name') || 'Administrador';

  const [stats, setStats] = useState<AdminStats>({
    usuarios: 0, tecnicos: 0, clientes: 0,
    ordenesPendientes: 0, ordenesEnProceso: 0, ordenesCompletadas: 0
  });
  const [loading, setLoading] = useState(true);
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState<OpcionAsignacion[]>([]);
  const [asignando, setAsignando] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string>('');
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>('');

  useEffect(() => { cargarEstadisticas(); }, []);

  const cargarEstadisticas = async () => {
  setLoading(true);
  try {
    const [adminsRes, tecnicosRes, clientesRes, ordenesRes] = await Promise.all([
      obtenerAdmins().catch(() => ({ data: [] })),
      obtenerTecnicos().catch(() => ({ data: [] })),
      obtenerClientes().catch(() => ({ data: [] })),
      obtenerOrdenes().catch(() => ({ data: [] }))
    ]);

    // 👇 Tipado explícito con <any> para evitar ts(18046)
    const admins = extraerDatos<any>(adminsRes.data);
    const tecnicos = extraerDatos<any>(tecnicosRes.data);
    const clientes = extraerDatos<any>(clientesRes.data);
    const ordenes = extraerDatos<any>(ordenesRes.data);

    const pendientes = ordenes.filter(o => o.Estado?.toLowerCase().includes('pendiente'));
    const enProceso = ordenes.filter(o => o.Estado?.toLowerCase().includes('proceso'));
    const completadas = ordenes.filter(o => o.Estado?.toLowerCase().includes('completado'));

    setStats({
      usuarios: admins.length + tecnicos.length + clientes.length,
      tecnicos: tecnicos.length,
      clientes: clientes.length,
      ordenesPendientes: pendientes.length,
      ordenesEnProceso: enProceso.length,
      ordenesCompletadas: completadas.length
    });

    setOrdenesPendientes(pendientes);
    setTecnicosDisponibles(tecnicos.map(t => ({ id: String(t.ID_TECNICOS), nombre: t.Nombre })));
  } catch (err) {
    console.error('Error al cargar dashboard:', err);
    Swal.fire('Error', 'No se pudieron cargar las estadísticas.', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleAsignarOrden = async () => {
    if (!ordenSeleccionada || !tecnicoSeleccionado) {
      Swal.fire('Atención', 'Selecciona orden y técnico.', 'warning');
      return;
    }
    setAsignando(true);
    try {
      await actualizarOrden(ordenSeleccionada, { 
        ID_TECNICOS: tecnicoSeleccionado, 
        Estado: 'En Proceso',
        Fecha_inicio: new Date().toISOString()
      });
      await cargarEstadisticas();
      setModalAsignarAbierto(false);
      setOrdenSeleccionada('');
      setTecnicoSeleccionado('');
      Swal.fire('Asignada', 'Orden asignada y marcada como En Proceso.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo asignar', 'error');
    } finally {
      setAsignando(false);
    }
  };

  const StatCard = ({
    title, value, icon, color, onClick
  }: {
    title: string; value: number; icon: string; color: string; onClick?: () => void
  }) => (
    <div className="stat-card" style={{ borderLeftColor: color }} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="stat-icon" style={{ color }}><i className={`bi ${icon}`}></i></div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const NavCard = ({ title, icon, color, onClick }: { title: string; icon: string; color: string; onClick: () => void }) => (
    <button className="action-btn" style={{ background: color, color: '#000' }} onClick={onClick}>
      <i className={`bi ${icon}`}></i> {title}
    </button>
  );

  if (loading) return <div className="dashboard-loader">Cargando panel administrativo...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-section">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="dashboard-title">Panel Administrativo</h1>
            <p className="dashboard-subtitle">Bienvenido, {adminNombre}</p>
          </div>
          <button onClick={() => clearSession()} style={{
            background: 'transparent', border: '2px solid #ff6600', color: '#ff6600',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s'
          }}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>

        <div className="stats-grid">
          <StatCard title="Usuarios Totales" value={stats.usuarios} icon="bi-people" color="#00d4ff" onClick={() => navigate('/admin/usuarios')} />
          <StatCard title="Técnicos" value={stats.tecnicos} icon="bi-person-badge" color="#ffd166" onClick={() => navigate('/admin/tecnicos')} />
          <StatCard title="Clientes" value={stats.clientes} icon="bi-person-lines-fill" color="#00ff88" onClick={() => navigate('/admin/clientes')} />
          <StatCard title="Órdenes Pendientes" value={stats.ordenesPendientes} icon="bi-clock-history" color="#ff6600" onClick={() => navigate('/admin/ordenes')} />
          <StatCard title="En Proceso" value={stats.ordenesEnProceso} icon="bi-arrow-repeat" color="#3b82f6" onClick={() => navigate('/admin/ordenes')} />
          <StatCard title="Completadas" value={stats.ordenesCompletadas} icon="bi-check-circle" color="#10b981" onClick={() => navigate('/admin/ordenes')} />
        </div>

        <div className="quick-actions">
          <h3 className="actions-title">Gestión Rápida</h3>
          <div className="actions-grid">
            <NavCard title="Asignar Orden a Técnico" icon="bi-clipboard-check" color="#ff6600" onClick={() => setModalAsignarAbierto(true)} />
            <NavCard title="Gestionar Usuarios" icon="bi-people-gear" color="#3b82f6" onClick={() => navigate('/admin/usuarios')} />
            <NavCard title="Órdenes de Servicio" icon="bi-clipboard2-pulse" color="#8b5cf6" onClick={() => navigate('/admin/ordenes')} />
            <NavCard title="Informes Técnicos" icon="bi-file-earmark-text" color="#10b981" onClick={() => navigate('/admin/informes')} />
            <NavCard title="Comprobantes" icon="bi-receipt" color="#f59e0b" onClick={() => navigate('/admin/comprobantes')} />
            <NavCard title="Historial Global" icon="bi-journal-text" color="#6b7280" onClick={() => navigate('/admin/historial')} />
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>📊 Estado del Sistema</h3>
            <ul className="info-list">
              <li><span className="info-label">Órdenes Pendientes:</span><span className="info-value info-negative">{stats.ordenesPendientes}</span></li>
              <li><span className="info-label">Órdenes En Proceso:</span><span className="info-value">{stats.ordenesEnProceso}</span></li>
              <li><span className="info-label">Órdenes Completadas:</span><span className="info-value info-positive">{stats.ordenesCompletadas}</span></li>
              <li><span className="info-label">Técnicos Activos:</span><span className="info-value">{stats.tecnicos}</span></li>
            </ul>
          </div>
          <div className="info-card">
            <h3>⚡ Funcionalidades</h3>
            <p className="info-text">Desde este panel centralizas la administración completa del taller:</p>
            <ul style={{ paddingLeft: '20px', color: '#aaa', marginTop: '8px', lineHeight: '1.8' }}>
              <li>Asigna órdenes a técnicos disponibles</li>
              <li>Gestiona administradores, técnicos y clientes</li>
              <li>Monitorea el estado de órdenes en tiempo real</li>
              <li>Accede a informes técnicos y comprobantes</li>
              <li>Consulta el historial completo del sistema</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL ASIGNAR ORDEN */}
      {modalAsignarAbierto && (
        <div className="modal-overlay" onClick={() => setModalAsignarAbierto(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-clipboard-check"></i> Asignar Orden a Técnico</h3>
              <button className="modal-close" onClick={() => setModalAsignarAbierto(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Orden Pendiente</label>
                <select value={ordenSeleccionada} onChange={e => setOrdenSeleccionada(e.target.value)}>
                  <option value="">Seleccionar orden...</option>
                  {ordenesPendientes.map(o => (
                    <option key={o.ID_ORDEN_SERVICIO} value={o.ID_ORDEN_SERVICIO}>
                      {o.ID_ORDEN_SERVICIO} - {o.ClienteNombre || 'Sin cliente'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Técnico Asignado</label>
                <select value={tecnicoSeleccionado} onChange={e => setTecnicoSeleccionado(e.target.value)}>
                  <option value="">Seleccionar técnico...</option>
                  {tecnicosDisponibles.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <button className="btn-guardar" onClick={handleAsignarOrden} disabled={asignando}>
                {asignando ? 'Asignando...' : 'Asignar y Marcar En Proceso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;