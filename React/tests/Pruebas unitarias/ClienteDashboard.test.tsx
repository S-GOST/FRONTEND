import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteDashboard from '../../src/componentes/TableCliente/ClienteDashboard';
import * as motoService from '../../src/services/moto.service';
import * as ordenService from '../../src/services/ordenServicioService';
import * as authService from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// 1. VARIABLES DE MOCK ANTES DE LOS jest.mock
const mockNavigate = jest.fn();
let mockPathname = '/cliente/dashboard';

// 2. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
  Outlet: () => <div data-testid="outlet">Contenido anidado</div>,
}));

// Mock de formatId para simplificar
jest.mock('../../src/utils/formatIds', () => ({
  formatId: (entity: string, id: any) => `${entity}-${id}`,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
jest.mock('../../src/services/moto.service');
jest.mock('../../src/services/ordenServicioService');
jest.mock('../../src/services/auth.services');

// ==================== DATOS DE PRUEBA ====================
const mockMotos = [
  { ID_MOTOS: 1, ID_CLIENTES: '100', Placa: 'ABC12D' },
  { ID_MOTOS: 2, ID_CLIENTES: '100', Placa: 'XYZ34E' },
  { ID_MOTOS: 3, ID_CLIENTES: '200', Placa: 'OTR99F' }, // De otro cliente
];

const mockOrdenes = [
  { ID_ORDEN_SERVICIO: 1, Estado: 'Completado', Fecha_inicio: '2026-08-01', Fecha_estimada: '2026-08-05', Fecha_fin: '2026-08-04' },
  { ID_ORDEN_SERVICIO: 2, Estado: 'En proceso', Fecha_inicio: '2026-08-10', Fecha_estimada: '2026-08-15' },
  { ID_ORDEN_SERVICIO: 3, Estado: 'Pendiente', Fecha_inicio: '2026-08-12' },
  { ID_ORDEN_SERVICIO: 4, Estado: 'Completado', Fecha_inicio: '2026-07-01' }, // Más antigua, no debe aparecer en recientes
];

describe('ClienteDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/cliente/dashboard';
    localStorage.setItem('user_id', '100');
    localStorage.setItem('user_name', 'Juan Cliente');

    jest.mocked(motoService.obtenerMotos).mockResolvedValue({ data: mockMotos } as any);
    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. RENDERIZADO DEL HEADER
  it('debería mostrar el saludo con el nombre del cliente y los botones de acción', () => {
    render(<ClienteDashboard />);

    expect(screen.getByText(/bienvenido, juan cliente/i)).toBeInTheDocument();
    expect(screen.getByText('Panel de Control del Cliente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al carrito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando tu información..." mientras consulta la API', () => {
    jest.mocked(motoService.obtenerMotos).mockImplementation(() => new Promise(() => {}));
    render(<ClienteDashboard />);

    expect(screen.getByText(/cargando tu información/i)).toBeInTheDocument();
  });

  // 3. CÁLCULO DE ESTADÍSTICAS
  it('debería calcular las estadísticas filtrando por el cliente', async () => {
    render(<ClienteDashboard />);

    await waitFor(() => {
      // Total órdenes = 4
      expect(screen.getByText('Total Órdenes').closest('.stat-card')).toHaveTextContent('4');
      // Completadas = 2
      expect(screen.getByText('Completadas').closest('.stat-card')).toHaveTextContent('2');
      // Pendientes = 2 (Pendiente + En proceso)
      expect(screen.getByText('Pendientes').closest('.stat-card')).toHaveTextContent('2');
      // Motos del cliente 100 = 2 (la moto del cliente 200 se excluye)
      expect(screen.getByText('Mis Motos').closest('.stat-card')).toHaveTextContent('2');
    });
  });

  // 4. NAVEGACIÓN DESDE ACCIONES RÁPIDAS
  it('debería navegar a las rutas correctas desde las acciones rápidas', async () => {
    render(<ClienteDashboard />);
    await waitFor(() => expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ver órdenes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/ordenes');

    fireEvent.click(screen.getByRole('button', { name: /mis motos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/motos');

    fireEvent.click(screen.getByRole('button', { name: /comprobantes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/comprobantes');

    fireEvent.click(screen.getByRole('button', { name: /historial/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/historial');
  });

  // 5. BOTÓN IR AL CARRITO
  it('debería navegar al carrito con el botón correspondiente', async () => {
    render(<ClienteDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /ir al carrito/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/carrito');
  });

  // 6. CIERRE DE SESIÓN
  it('debería confirmar y cerrar sesión', async () => {
    render(<ClienteDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¿Cerrar sesión?', icon: 'warning' })
      );
      expect(authService.clearSession).toHaveBeenCalled();
    });
  });

  // 7. CIERRE DE SESIÓN CANCELADO
  it('no debería cerrar sesión si se cancela', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<ClienteDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(authService.clearSession).not.toHaveBeenCalled();
    });
  });

  // 8. ÓRDENES RECIENTES (máximo 3, ordenadas por fecha)
  it('debería mostrar solo las 3 órdenes más recientes con su estado', async () => {
    render(<ClienteDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Seguimiento de Órdenes Recientes')).toBeInTheDocument();
    });

    // Las 3 más recientes (ordenadas por Fecha_inicio descendente)
    expect(screen.getByText(/orden-3/i)).toBeInTheDocument(); // 2026-08-12
    expect(screen.getByText(/orden-2/i)).toBeInTheDocument(); // 2026-08-10
    expect(screen.getByText(/orden-1/i)).toBeInTheDocument(); // 2026-08-01
    // La más antigua NO aparece
    expect(screen.queryByText(/orden-4/i)).not.toBeInTheDocument();

    // Badges de estado y etiquetas de progreso
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getAllByText('Recepcionada').length).toBe(3);
    expect(screen.getAllByText('En Taller').length).toBe(3);
    expect(screen.getAllByText('Lista').length).toBe(3);
  });

  // 9. ESTADO VACÍO DE ÓRDENES
  it('debería mostrar mensaje cuando no hay órdenes recientes', async () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: [] } as any);
    jest.mocked(motoService.obtenerMotos).mockResolvedValue({ data: [] } as any);

    render(<ClienteDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no tienes órdenes de servicio recientes/i)).toBeInTheDocument();
    });
  });

  // 10. RUTA NO ÍNDICE → OUTLET
  it('debería renderizar el Outlet cuando la ruta no es la principal', async () => {
    mockPathname = '/cliente/ordenes';
    render(<ClienteDashboard />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    // No debe mostrar las estadísticas
    expect(screen.queryByText('Acciones Rápidas')).not.toBeInTheDocument();
  });

  // 11. RESILIENCIA ANTE ERRORES DE API
  it('debería renderizar con ceros si los servicios fallan', async () => {
    jest.mocked(motoService.obtenerMotos).mockRejectedValue(new Error('Fallo'));
    jest.mocked(ordenService.obtenerMisOrdenes).mockRejectedValue(new Error('Fallo'));

    render(<ClienteDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/cargando tu información/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Total Órdenes').closest('.stat-card')).toHaveTextContent('0');
    expect(screen.getByText('Mis Motos').closest('.stat-card')).toHaveTextContent('0');
  });
});