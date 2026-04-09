import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TecnicoDashboard.css';

// ==================== TIPOS ====================
interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface DetalleOrden {
  servicio: string;
  cantidad: number;
  precio: number;
}

interface OrdenServicio {
  id: string;
  clienteId: string;
  vehiculo: string;
  descripcion: string;
  estado: 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado';
  fechaCreacion: string;
  tecnicoAsignado: string;
  detalles: DetalleOrden[];
}

// ==================== SERVICIOS SIMULADOS ====================
const inicializarDatos = () => {
  // Clientes por defecto
  const clientesStorage = localStorage.getItem('clientes_mock');
  if (!clientesStorage) {
    const clientesMock: Cliente[] = [
      { id: 'c1', nombre: 'Juan Pérez', telefono: '3001234567', email: 'juan@example.com', direccion: 'Calle 1 #2-3' },
      { id: 'c2', nombre: 'María González', telefono: '3109876543', email: 'maria@example.com', direccion: 'Carrera 4 #5-6' },
      { id: 'c3', nombre: 'Luis Rodríguez', telefono: '3204567890', email: 'luis@example.com', direccion: 'Avenida 7 #8-9' },
    ];
    localStorage.setItem('clientes_mock', JSON.stringify(clientesMock));
  }

  // Órdenes por defecto
  const ordenesStorage = localStorage.getItem('ordenes_mock');
  if (!ordenesStorage) {
    const ordenesMock: OrdenServicio[] = [
      {
        id: 'OS-001',
        clienteId: 'c1',
        vehiculo: 'KTM Duke 390',
        descripcion: 'Cambio de aceite y filtro',
        estado: 'Pendiente',
        fechaCreacion: '2025-03-15',
        tecnicoAsignado: 'Carlos López',
        detalles: [
          { servicio: 'Cambio de aceite', cantidad: 1, precio: 50000 },
          { servicio: 'Filtro de aceite', cantidad: 1, precio: 25000 },
        ],
      },
      {
        id: 'OS-002',
        clienteId: 'c2',
        vehiculo: 'KTM RC 200',
        descripcion: 'Revisión de frenos y luces',
        estado: 'En Proceso',
        fechaCreacion: '2025-03-14',
        tecnicoAsignado: 'Ana Martínez',
        detalles: [
          { servicio: 'Revisión frenos delanteros', cantidad: 1, precio: 35000 },
          { servicio: 'Cambio bombilla luz trasera', cantidad: 1, precio: 15000 },
        ],
      },
      {
        id: 'OS-003',
        clienteId: 'c3',
        vehiculo: 'KTM Adventure 790',
        descripcion: 'Ajuste de suspensión',
        estado: 'Completado',
        fechaCreacion: '2025-03-10',
        tecnicoAsignado: 'Carlos López',
        detalles: [
          { servicio: 'Ajuste de suspensión delantera', cantidad: 1, precio: 80000 },
        ],
      },
    ];
    localStorage.setItem('ordenes_mock', JSON.stringify(ordenesMock));
  }
};

const obtenerClientes = async (): Promise<Cliente[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = localStorage.getItem('clientes_mock');
      resolve(data ? JSON.parse(data) : []);
    }, 300);
  });
};

const guardarClientes = async (clientes: Cliente[]) => {
  localStorage.setItem('clientes_mock', JSON.stringify(clientes));
};

const obtenerOrdenes = async (): Promise<OrdenServicio[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = localStorage.getItem('ordenes_mock');
      resolve(data ? JSON.parse(data) : []);
    }, 300);
  });
};

const guardarOrdenes = async (ordenes: OrdenServicio[]) => {
  localStorage.setItem('ordenes_mock', JSON.stringify(ordenes));
};

const actualizarEstadoOrden = async (id: string, nuevoEstado: OrdenServicio['estado']) => {
  const ordenes = await obtenerOrdenes();
  const index = ordenes.findIndex(o => o.id === id);
  if (index !== -1) {
    ordenes[index].estado = nuevoEstado;
    await guardarOrdenes(ordenes);
  } else {
    throw new Error('Orden no encontrada');
  }
};

const agregarCliente = async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const clientes = await obtenerClientes();
  const nuevoId = `c${Date.now()}`;
  const nuevoCliente = { ...cliente, id: nuevoId };
  clientes.push(nuevoCliente);
  await guardarClientes(clientes);
  return nuevoCliente;
};

const actualizarCliente = async (cliente: Cliente) => {
  const clientes = await obtenerClientes();
  const index = clientes.findIndex(c => c.id === cliente.id);
  if (index !== -1) {
    clientes[index] = cliente;
    await guardarClientes(clientes);
  } else {
    throw new Error('Cliente no encontrado');
  }
};

const eliminarCliente = async (id: string) => {
  let clientes = await obtenerClientes();
  clientes = clientes.filter(c => c.id !== id);
  await guardarClientes(clientes);
};

// ==================== COMPONENTE PRINCIPAL ====================
const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ordenes' | 'clientes' | 'informe'>('ordenes');
  
  // Estados para órdenes
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenServicio | null>(null);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  
  // Estados para clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de datos
  useEffect(() => {
    inicializarDatos();
    cargarOrdenes();
    cargarClientes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoadingOrdenes(true);
      const data = await obtenerOrdenes();
      setOrdenes(data);
    } catch (err) {
      setError('Error al cargar órdenes');
    } finally {
      setLoadingOrdenes(false);
    }
  };

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true);
      const data = await obtenerClientes();
      setClientes(data);
    } catch (err) {
      setError('Error al cargar clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: OrdenServicio['estado']) => {
    setActualizando(id);
    try {
      await actualizarEstadoOrden(id, nuevoEstado);
      await cargarOrdenes(); // Recargar para sincronizar
    } catch (err) {
      alert('No se pudo actualizar el estado');
    } finally {
      setActualizando(null);
    }
  };

  const verDetallesOrden = (orden: OrdenServicio) => {
    setOrdenSeleccionada(orden);
    setModalDetallesAbierto(true);
  };

  // CRUD Clientes
  const abrirModalNuevoCliente = () => {
    setClienteEditando(null);
    setFormCliente({ nombre: '', telefono: '', email: '', direccion: '' });
    setModalClienteAbierto(true);
  };

  const abrirModalEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormCliente({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
    });
    setModalClienteAbierto(true);
  };

  const guardarCliente = async () => {
    if (!formCliente.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    try {
      if (clienteEditando) {
        const clienteActualizado: Cliente = { ...clienteEditando, ...formCliente };
        await actualizarCliente(clienteActualizado);
      } else {
        await agregarCliente(formCliente);
      }
      await cargarClientes();
      setModalClienteAbierto(false);
    } catch (err) {
      alert('Error al guardar el cliente');
    }
  };

  const handleEliminarCliente = async (id: string) => {
    if (window.confirm('¿Eliminar este cliente? Se perderán sus datos.')) {
      try {
        await eliminarCliente(id);
        await cargarClientes();
      } catch (err) {
        alert('Error al eliminar cliente');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_name');
      navigate('/login');
    }
  };

  // Filtrar órdenes
  const ordenesFiltradas = filtroEstado === 'todas'
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado);

  const getEstadoClass = (estado: OrdenServicio['estado']) => {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'En Proceso': return 'estado-proceso';
      case 'Completado': return 'estado-completado';
      case 'Cancelado': return 'estado-cancelado';
      default: return '';
    }
  };

  const getBadgeIcon = (estado: OrdenServicio['estado']) => {
    switch (estado) {
      case 'Pendiente': return 'bi-clock-history';
      case 'En Proceso': return 'bi-arrow-repeat';
      case 'Completado': return 'bi-check-circle';
      case 'Cancelado': return 'bi-x-circle';
      default: return 'bi-question-circle';
    }
  };

  // Datos para el informe
  const obtenerInforme = () => {
    const totalOrdenes = ordenes.length;
    const porEstado = {
      Pendiente: ordenes.filter(o => o.estado === 'Pendiente').length,
      EnProceso: ordenes.filter(o => o.estado === 'En Proceso').length,
      Completado: ordenes.filter(o => o.estado === 'Completado').length,
      Cancelado: ordenes.filter(o => o.estado === 'Cancelado').length,
    };
    const porCliente = clientes.map(cliente => {
      const ordenesCliente = ordenes.filter(o => o.clienteId === cliente.id);
      const estados = ordenesCliente.map(o => o.estado);
      const estadoFrecuente = estados.sort((a,b) =>
        estados.filter(v => v===a).length - estados.filter(v => v===b).length
      ).pop() || 'Ninguna';
      return {
        cliente: cliente.nombre,
        total: ordenesCliente.length,
        estadoFrecuente,
      };
    }).filter(c => c.total > 0);
    return { totalOrdenes, porEstado, porCliente };
  };

  const imprimirInforme = () => {
    const contenido = document.getElementById('informe-contenido');
    if (!contenido) return;
    const ventana = window.open('', '_blank');
    ventana?.document.write(`
      <html>
        <head><title>Informe de Órdenes</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
        </head>
        <body>${contenido.innerHTML}</body>
      </html>
    `);
    ventana?.document.close();
    ventana?.print();
  };

  // Helper para obtener nombre de cliente por ID
  const obtenerNombreCliente = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Desconocido';
  };

  return (
    <div className="tecnico-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1><i className="bi bi-wrench"></i> Panel Técnico</h1>
            <p>Gestión de órdenes, clientes e informes</p>
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'ordenes' ? 'active' : ''}`} onClick={() => setActiveTab('ordenes')}>
          <i className="bi bi-card-list"></i> Órdenes de Servicio
        </button>
        <button className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
          <i className="bi bi-people"></i> Clientes
        </button>
        <button className={`tab-btn ${activeTab === 'informe' ? 'active' : ''}`} onClick={() => setActiveTab('informe')}>
          <i className="bi bi-graph-up"></i> Informe
        </button>
      </div>

      <main className="dashboard-main">
        {error && <div className="error-banner">{error}</div>}

        {/* Pestaña Órdenes */}
        {activeTab === 'ordenes' && (
          <>
            <div className="filter-bar">
              <div className="filter-group">
                <label><i className="bi bi-funnel"></i> Filtrar por estado:</label>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="filter-select">
                  <option value="todas">Todas</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completado">Completadas</option>
                  <option value="Cancelado">Canceladas</option>
                </select>
              </div>
              <button className="refresh-btn" onClick={cargarOrdenes}>
                <i className="bi bi-arrow-clockwise"></i> Actualizar
              </button>
            </div>

            {loadingOrdenes ? (
              <div className="loading-spinner">Cargando órdenes...</div>
            ) : (
              <div className="table-container">
                <table className="ordenes-table">
                  <thead>
                    <tr><th>ID</th><th>Cliente</th><th>Vehículo</th><th>Descripción</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.length === 0 ? (
                      <tr><td colSpan={7} className="empty-row">No hay órdenes con este estado</td></tr>
                    ) : (
                      ordenesFiltradas.map(orden => (
                        <tr key={orden.id}>
                          <td className="orden-id">{orden.id}</td>
                          <td>{obtenerNombreCliente(orden.clienteId)}</td>
                          <td>{orden.vehiculo}</td>
                          <td className="descripcion-cell">{orden.descripcion}</td>
                          <td>{orden.fechaCreacion}</td>
                          <td><span className={`estado-badge ${getEstadoClass(orden.estado)}`}><i className={`bi ${getBadgeIcon(orden.estado)}`}></i> {orden.estado}</span></td>
                          <td>
                            <div className="acciones-botones">
                              <select value={orden.estado} onChange={(e) => handleCambiarEstado(orden.id, e.target.value as any)} disabled={actualizando === orden.id} className="estado-select-small">
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Completado">Completado</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                              <button className="btn-detalles" onClick={() => verDetallesOrden(orden)}><i className="bi bi-eye"></i> Ver</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pestaña Clientes */}
        {activeTab === 'clientes' && (
          <>
            <div className="filter-bar">
              <button className="btn-primary" onClick={abrirModalNuevoCliente}><i className="bi bi-plus-circle"></i> Nuevo Cliente</button>
            </div>
            {loadingClientes ? (
              <div className="loading-spinner">Cargando clientes...</div>
            ) : (
              <div className="table-container">
                <table className="clientes-table">
                  <thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {clientes.map(cliente => (
                      <tr key={cliente.id}>
                        <td><strong>{cliente.nombre}</strong></td>
                        <td>{cliente.telefono}</td>
                        <td>{cliente.email}</td>
                        <td>{cliente.direccion}</td>
                        <td>
                          <button className="btn-editar" onClick={() => abrirModalEditarCliente(cliente)}><i className="bi bi-pencil"></i> Editar</button>
                          <button className="btn-eliminar" onClick={() => handleEliminarCliente(cliente.id)}><i className="bi bi-trash"></i> Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pestaña Informe */}
        {activeTab === 'informe' && (
          <div id="informe-contenido" className="informe-contenido">
            <h2><i className="bi bi-bar-chart-steps"></i> Informe de Gestión</h2>
            {(() => {
              const { totalOrdenes, porEstado, porCliente } = obtenerInforme();
              return (
                <>
                  <div className="stats-grid-informe">
                    <div className="stat-card-informe"><h3>Total Órdenes</h3><p className="big-number">{totalOrdenes}</p></div>
                    <div className="stat-card-informe"><h3>Pendientes</h3><p className="big-number">{porEstado.Pendiente}</p></div>
                    <div className="stat-card-informe"><h3>En Proceso</h3><p className="big-number">{porEstado.EnProceso}</p></div>
                    <div className="stat-card-informe"><h3>Completadas</h3><p className="big-number">{porEstado.Completado}</p></div>
                  </div>
                  <h3>Resumen por Cliente</h3>
                  <table className="informe-table">
                    <thead><tr><th>Cliente</th><th>Total Órdenes</th><th>Estado más frecuente</th></tr></thead>
                    <tbody>
                      {porCliente.map((item, idx) => (
                        <tr key={idx}><td>{item.cliente}</td><td>{item.total}</td><td>{item.estadoFrecuente}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn-imprimir" onClick={imprimirInforme}><i className="bi bi-printer"></i> Imprimir Informe</button>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* Modal Detalles de Orden */}
      {modalDetallesAbierto && ordenSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalDetallesAbierto(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="bi bi-file-text"></i> Detalles de Orden {ordenSeleccionada.id}</h3><button className="modal-close" onClick={() => setModalDetallesAbierto(false)}>×</button></div>
            <div className="modal-body">
              <p><strong>Cliente:</strong> {obtenerNombreCliente(ordenSeleccionada.clienteId)}</p>
              <p><strong>Vehículo:</strong> {ordenSeleccionada.vehiculo}</p>
              <p><strong>Descripción:</strong> {ordenSeleccionada.descripcion}</p>
              <p><strong>Fecha:</strong> {ordenSeleccionada.fechaCreacion}</p>
              <p><strong>Técnico:</strong> {ordenSeleccionada.tecnicoAsignado}</p>
              <p><strong>Estado:</strong> <span className={`estado-badge ${getEstadoClass(ordenSeleccionada.estado)}`}>{ordenSeleccionada.estado}</span></p>
              <h4>Servicios/Productos realizados</h4>
              <table className="detalles-table">
                <thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {ordenSeleccionada.detalles.map((d, i) => (
                    <tr key={i}><td>{d.servicio}</td><td>{d.cantidad}</td><td>${d.precio.toLocaleString()}</td><td>${(d.cantidad * d.precio).toLocaleString()}</td></tr>
                  ))}
                  <tr className="total-row"><td colSpan={3}><strong>Total</strong></td><td><strong>${ordenSeleccionada.detalles.reduce((sum, d) => sum + d.cantidad * d.precio, 0).toLocaleString()}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente (nuevo/editar) */}
      {modalClienteAbierto && (
        <div className="modal-overlay" onClick={() => setModalClienteAbierto(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}</h3><button className="modal-close" onClick={() => setModalClienteAbierto(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Nombre *</label><input type="text" value={formCliente.nombre} onChange={e => setFormCliente({...formCliente, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Teléfono</label><input type="text" value={formCliente.telefono} onChange={e => setFormCliente({...formCliente, telefono: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formCliente.email} onChange={e => setFormCliente({...formCliente, email: e.target.value})} /></div>
              <div className="form-group"><label>Dirección</label><input type="text" value={formCliente.direccion} onChange={e => setFormCliente({...formCliente, direccion: e.target.value})} /></div>
              <button className="btn-guardar" onClick={guardarCliente}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TecnicoDashboard;