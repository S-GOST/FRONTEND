import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerAdmins } from '../../services/admin.service';
import { obtenerTecnicos } from '../../services/tecnico.service';
import { obtenerClientes, obtenerClientesPendientes } from '../../services/cliente.service';
import { obtenerOrdenes } from '../../services/ordenServicioService';
import { clearSession } from '../../services/auth.services';
import rock from "../../assets/icons/rock.png";

import './Dashboard.css';
import './Panel.css'; // Para heredar estilos del panel (header)

// ==================== TIPOS ====================
interface AdminStats {
  usuarios: number;
  tecnicos: number;
  clientes: number;
  clientesPendientes: number;
  ordenesPendientes: number;
  ordenesEnProceso: number;
  ordenesCompletadas: number;
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

// ==================== SUB-COMPONENTES (MEMOIZADOS) ====================
const StatCard = React.memo(({
  title, value, icon, color, onClick, className = ''
}: {
  title: string; value: number; icon: string; color: string; onClick?: () => void; className?: string;
}) => (
  <div className={`stat-card ${className}`} style={{ '--card-color': color } as React.CSSProperties} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="stat-icon" style={{ color, background: `linear-gradient(135deg, ${color}22, ${color}05)` }}><i className={`bi ${icon}`}></i></div>
    <div className="stat-content">
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const NavCard = React.memo(({ title, icon, color, onClick, className = '' }: { title: string; icon: string; color: string; onClick: () => void; className?: string; }) => (
  <button className={`action-btn ${className}`} onClick={onClick}>
    <div className="action-icon-wrapper" style={{ color: color, background: `linear-gradient(135deg, ${color}22, ${color}05)` }}>
      <i className={`bi ${icon}`}></i>
    </div>
    <span className="action-title">{title}</span>
  </button>
));
NavCard.displayName = 'NavCard';

// ==================== COMPONENTE ====================
function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Administrador';

  const [stats, setStats] = useState<AdminStats>({
    usuarios: 0, tecnicos: 0, clientes: 0, clientesPendientes: 0,
    ordenesPendientes: 0, ordenesEnProceso: 0, ordenesCompletadas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarEstadisticas(); }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const [adminsRes, tecnicosRes, clientesRes, clientesPendRes, ordenesRes] = await Promise.all([
        obtenerAdmins().catch(() => ({ data: [] })),
        obtenerTecnicos().catch(() => ({ data: [] })),
        obtenerClientes().catch(() => ({ data: [] })),
        obtenerClientesPendientes().catch(() => ({ data: [] })),
        obtenerOrdenes().catch(() => ({ data: [] }))
      ]);

      // 👇 Tipado explícito con <any> para evitar ts(18046)
      const admins = extraerDatos<any>(adminsRes.data);
      const tecnicos = extraerDatos<any>(tecnicosRes.data);
      const clientes = extraerDatos<any>(clientesRes.data);
      const clientesPend = extraerDatos<any>(clientesPendRes.data);
      const ordenes = extraerDatos<any>(ordenesRes.data);

      const pendientes = ordenes.filter(o => o.Estado?.toLowerCase().includes('pendiente'));
      const enProceso = ordenes.filter(o => o.Estado?.toLowerCase().includes('proceso'));
      const completadas = ordenes.filter(o => {
        const st = o.Estado?.toLowerCase() || '';
        return st.includes('completado') || st.includes('finalizado') || st.includes('finalizada');
      });

      setStats({
        usuarios: admins.length + tecnicos.length + clientes.length,
        tecnicos: tecnicos.length,
        clientes: clientes.length,
        clientesPendientes: clientesPend.length,
        ordenesPendientes: pendientes.length,
        ordenesEnProceso: enProceso.length,
        ordenesCompletadas: completadas.length
      });

    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      Swal.fire('Error', 'No se pudieron cargar las estadísticas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    Swal.fire({
      title: "¿Salir del sistema?",
      text: "Tu sesión será cerrada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF6D1F",
      cancelButtonColor: "#333",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        clearSession();
      }
    });
  }, []);

  const handleNavigate = useCallback((path: string) => () => navigate(path), [navigate]);

  if (loading) return <div className="dashboard-loader">Cargando panel administrativo...</div>;

  return (
    <div className="panel-container notranslate" translate="no" style={{ position: 'relative', overflowY: 'auto', minHeight: '100vh', background: '#050505' }}>
      
      {/* HEADER TIPO PANEL */}
      <header className="d-flex justify-content-between align-items-center p-3" style={{ position: 'absolute' }}>
        <div className="navbar-brand">
          <Link to="/">
            <img src={rock} alt="Logo" className="logo-img me-3" />
          </Link>
        </div>

        <div className="d-flex align-items-center">
          <span className="navbar-text me-4 d-none d-md-block user-info-navbar text-white">
            <i className="fas fa-user-circle me-2"></i>
            <strong>{userName}</strong>
          </span>

          <button type="button" onClick={handleLogout} className="btn-ktm">
            <i className="fa-solid fa-power-off me-2"></i> Cerrar sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO DEL DASHBOARD */}
      <div className="dashboard-page" style={{ paddingTop: '100px' }}>
        <div className="dashboard-section">
          <div className="stats-grid">
            <StatCard title="Usuarios Totales" value={stats.usuarios} icon="bi-people" color="#00d4ff" onClick={handleNavigate('/admin/usuarios')} />
            <StatCard title="Técnicos" value={stats.tecnicos} icon="bi-person-badge" color="#ffd166" onClick={handleNavigate('/admin/tecnicos')} />
            <StatCard title="Clientes" value={stats.clientes} icon="bi-person-lines-fill" color="#00ff88" onClick={handleNavigate('/admin/clientes')} />
            <StatCard title="Clientes por Aprobar" value={stats.clientesPendientes} icon="bi-person-plus-fill" color="#ff9800" onClick={handleNavigate('/admin/usuarios')} className={stats.clientesPendientes > 0 ? 'pulse-alert' : ''} />
            <StatCard title="Órdenes Pendientes" value={stats.ordenesPendientes} icon="bi-clock-history" color="#ff6600" onClick={handleNavigate('/admin/asignacion_tecnicos')} className={stats.ordenesPendientes > 0 ? 'pulse-alert' : ''} />
            <StatCard title="En Proceso" value={stats.ordenesEnProceso} icon="bi-arrow-repeat" color="#3b82f6" onClick={handleNavigate('/admin/asignacion_tecnicos')} />
            <StatCard title="Completadas" value={stats.ordenesCompletadas} icon="bi-check-circle" color="#10b981" onClick={handleNavigate('/admin/asignacion_tecnicos')} />
          </div>

          <div className="quick-actions">
            <h3 className="actions-title">Gestión Rápida</h3>
            <div className="actions-grid">
              <NavCard title="Gestionar Usuarios" icon="bi-person-badge" color="#3b82f6" onClick={handleNavigate('/admin/usuarios')} className={stats.clientesPendientes > 0 ? 'pulse-alert' : ''} />
              <NavCard title="Nuevas Órdenes" icon="bi-clipboard2-pulse" color="#8b5cf6" onClick={handleNavigate('/admin/asignacion_tecnicos')} />
              <NavCard title="Servicios" icon="bi-wrench-adjustable" color="#06b6d4" onClick={handleNavigate('/admin/servicios')} />
              <NavCard title="Productos" icon="bi-box-seam" color="#ec4899" onClick={handleNavigate('/admin/productos')} />
              <NavCard title="Categorías" icon="bi-tags" color="#f97316" onClick={handleNavigate('/admin/categorias')} />
              <NavCard title="Informes Técnicos" icon="bi-file-earmark-text" color="#10b981" onClick={handleNavigate('/admin/informe')} />
              <NavCard title="Comprobantes" icon="bi-receipt" color="#f59e0b" onClick={handleNavigate('/admin/comprobante')} />
              <NavCard title="Historial Global" icon="bi-journal-text" color="#6b7280" onClick={handleNavigate('/admin/historial')} />
              <NavCard title="Productividad" icon="bi-graph-up-arrow" color="#14b8a6" onClick={handleNavigate('/admin/productividad')} />
              <NavCard title="Inventario" icon="bi-box-seam" color="#8b5cf6" onClick={handleNavigate('/admin/inventario')} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;