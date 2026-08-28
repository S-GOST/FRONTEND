import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Asegura que los matchers como toBeInTheDocument funcionen

// 1. DECLARAR VARIABLES DE MOCK ANTES DE LOS JEST.MOCK (Crucial para evitar errores de hoisting)
const mockNavigate = jest.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

// 3. MOCKS DE SERVICIOS
jest.mock('../../src/services/admin.service');
jest.mock('../../src/services/tecnico.service');
jest.mock('../../src/services/cliente.service');
jest.mock('../../src/services/ordenServicioService');
jest.mock('../../src/services/auth.services');

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
  // Usamos jest.mocked() para tener autocompletado y tipado correcto de TypeScript
  jest.mocked(adminService.obtenerAdmins).mockResolvedValue(overrides.admins ?? { data: [{ id: 1 }] });
  jest.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue(overrides.tecnicos ?? { data: [{ id: 1 }, { id: 2 }] });
  jest.mocked(clienteService.obtenerClientes).mockResolvedValue(overrides.clientes ?? { data: [{ id: 1 }] });
  jest.mocked(clienteService.obtenerClientesPendientes).mockResolvedValue(overrides.clientesPend ?? { data: [] });
  jest.mocked(ordenService.obtenerOrdenes).mockResolvedValue(overrides.ordenes ?? { 
    data: [{ Estado: 'Pendiente' }, { Estado: 'En Proceso' }, { Estado: 'Completado' }] 
  });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('user_name', 'Test Admin');
    setupMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. PRUEBA DE ESTADO DE CARGA
  it('debería mostrar el mensaje de carga inicialmente', () => {
    // Retrasamos la resolución de la promesa para simular carga infinita
    jest.mocked(adminService.obtenerAdmins).mockImplementation(() => new Promise(() => {}));
    
    render(<Dashboard />);
    expect(screen.getByText(/cargando panel administrativo/i)).toBeInTheDocument();
  });

  // 2. PRUEBA DE RENDERIZADO Y CÁLCULO DE ESTADÍSTICAS
  it('debería renderizar el dashboard con las estadísticas calculadas correctamente', async () => {
    render(<Dashboard />);

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
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    // Buscamos el texto y subimos al ancestro más cercano con la clase stat-card
    const pendingCard = screen.getByText('Órdenes Pendientes').closest('.stat-card');
    expect(pendingCard).toHaveClass('pulse-alert');
  });

  // 4. PRUEBA DE NAVEGACIÓN (StatCard)
  it('debería navegar a la ruta correcta al hacer clic en una StatCard', async () => {
    render(<Dashboard />);
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
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.queryByText(/cargando panel administrativo/i)).not.toBeInTheDocument();
    });

    const navCard = screen.getByRole('button', { name: /gestionar usuarios/i });
    fireEvent.click(navCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/usuarios');
  });

  // 6. PRUEBA DE CIERRE DE SESIÓN
  it('debería mostrar confirmación y cerrar sesión al hacer clic en "Cerrar sesión"', async () => {
    render(<Dashboard />);
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
  it('debería mostrar una alerta de error si falla la carga de estadísticas', async () => {
    // Forzar un error en uno de los servicios
    jest.mocked(adminService.obtenerAdmins).mockRejectedValue(new Error('Fallo de red'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar las estadísticas.',
        'error'
      );
    });
  });
});

export default Dashboard;