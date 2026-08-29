import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Asegura que los matchers como toBeInTheDocument funcionen

// 1. DECLARAR VARIABLES DE MOCK ANTES DE LOS Mock (Crucial para evitar errores de hoisting)
const mockNavigate = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }), getInput: vi.fn() } }));

vi.mock('react-router-dom', async () => {
  const originalModule = await vi.importActual('react-router-dom') as any;
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

// 3. MOCKS DE SERVICIOS
vi.mock('../../src/services/admin.service');
vi.mock('../../src/services/tecnico.service');
vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/ordenServicioService');
vi.mock('../../src/services/auth.services');

// 4. IMPORTAR EL COMPONENTE Y LOS SERVICIOS
import Dashboard from '../../src/componentes/TableAdmin/Dashboard';
import * as adminService from '../../src/services/admin.service';
import * as tecnicoService from '../../src/services/tecnico.service';
import * as clienteService from '../../src/services/cliente.service';
import * as ordenService from '../../src/services/ordenServicioService';
import * as authService from '../../src/services/auth.services';
import Swal from 'sweetalert2';
// ==================== HELPERS DE PRUEBA ====================
const setupMocks = (overrides: any = {}) => {
  // Usamos vi.mocked() para tener autocompletado y tipado correcto de TypeScript
  vi.mocked(adminService.obtenerAdmins).mockResolvedValue(overrides.admins ?? { data: [{ id: 1 }] });
  vi.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue(overrides.tecnicos ?? { data: [{ id: 1 }, { id: 2 }] });
  vi.mocked(clienteService.obtenerClientes).mockResolvedValue(overrides.clientes ?? { data: [{ id: 1 }] });
  vi.mocked(clienteService.obtenerClientesPendientes).mockResolvedValue(overrides.clientesPend ?? { data: [] });
  vi.mocked(ordenService.obtenerOrdenes).mockResolvedValue(overrides.ordenes ?? { 
    data: [{ Estado: 'Pendiente' }, { Estado: 'En Proceso' }, { Estado: 'Completado' }] 
  });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_name', 'Test Admin');
    setupMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. PRUEBA DE ESTADO DE CARGA
  it('debería mostrar el mensaje de carga inicialmente', () => {
    // Retrasamos la resolución de la promesa para simular carga infinita
    vi.mocked(adminService.obtenerAdmins).mockImplementation(() => new Promise(() => {}));
    
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/cargando panel administrativo/i)).toBeInTheDocument();
  });

  // 2. PRUEBA DE RENDERIZADO Y CÁLCULO DE ESTADÍSTICAS
  it('debería renderizar el dashboard con las estadísticas calculadas correctamente', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    // Esperar a que termine la carga
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    // Verificar nombre de usuario
    expect(screen.getByText('Test Admin')).toBeInTheDocument();

    // Verificar cálculos: Admins(1) + Tecnicos(2) + Clientes(1) = 4 Usuarios Totales
    expect(screen.getByText('4')).toBeInTheDocument(); 
    
    // Verificar que se muestran los títulos de las tarjetas
    expect(screen.getByText('Técnicos')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Órdenes Pendientes')).toBeInTheDocument();
  });

  // 3. PRUEBA DE COMPORTAMIENTO VISUAL CONDICIONAL
  it('debería aplicar la clase "pulse-alert" si hay órdenes pendientes', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    // Buscamos el texto y subimos al ancestro más cercano con la clase stat-card
    const pendingCard = screen.getByText('Órdenes Pendientes').closest('.stat-card');
    expect(pendingCard).toHaveClass('pulse-alert');
  });

  // 4. PRUEBA DE NAVEGACIÓN (StatCard)
  it('debería navegar a la ruta correcta al hacer clic en una StatCard', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    // StatCard tiene role="button" cuando tiene onClick
    const usuariosCard = screen.getByRole('button', { name: /usuarios totales/i });
    fireEvent.click(usuariosCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/usuarios');
  });

  // 5. PRUEBA DE NAVEGACIÓN (NavCard)
  it('debería navegar a la ruta correcta al hacer clic en un NavCard', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    const navCard = screen.getByRole('button', { name: /gestionar usuarios/i });
    fireEvent.click(navCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/usuarios');
  });

  // 6. PRUEBA DE CIERRE DE SESIÓN
  it('debería mostrar confirmación y cerrar sesión al hacer clic en "Cerrar sesión"', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutButton);

    // Verificar que se mostró la alerta de SweetAlert2
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: "¿Salir del sistema?",
      icon: "warning",
    }));

    // Como mockeamos Swal para que siempre retorne { isConfirmed: true }, 
    // se debería llamar a clearSession
    await waitFor(() => {
      expect(authService.clearSession).toHaveBeenCalled();
    });
  });

  // 7. PRUEBA DE MANEJO DE ERRORES
  it('debería renderizar con ceros si los servicios fallan', async () => {
    vi.mocked(adminService.obtenerAdmins).mockRejectedValue(new Error('Fallo de red'));
    vi.mocked(tecnicoService.obtenerTecnicos).mockRejectedValue(new Error('Fallo de red'));
    vi.mocked(clienteService.obtenerClientes).mockRejectedValue(new Error('Fallo de red'));
    vi.mocked(clienteService.obtenerClientesPendientes).mockRejectedValue(new Error('Fallo de red'));
    vi.mocked(ordenService.obtenerOrdenes).mockRejectedValue(new Error('Fallo de red'));

    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Usuarios Totales').closest('.stat-card')).toHaveTextContent('0');
  });
});

export default Dashboard;



