import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TecnicoDashboard from '../../src/componentes/TableTecnico/TecnicoDashboard';
import * as ordenService from '../../src/services/ordenServicioService';
import * as clienteService from '../../src/services/cliente.service';
import * as authService from '../../src/services/auth.services';
import * as informeService from '../../src/services/informe.service';
import * as motoService from '../../src/services/moto.service';
import Swal from 'sweetalert2';

// 1. VARIABLES DE MOCK
const mockNavigate = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/utils/formatIds', () => ({
  formatId: (tipo: string, id: any) => `${tipo}-${id}`,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/ordenServicioService');
vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/auth.services');
vi.mock('../../src/services/informe.service');
vi.mock('../../src/services/moto.service');

// ==================== DATOS DE PRUEBA ====================
const mockOrdenes = [
  { ID_ORDEN_SERVICIO: '1', ID_CLIENTES: '100', ID_TECNICOS: '5', ID_MOTOS: '10', Estado: 'Pendiente', Fecha_inicio: '2026-08-01', Fecha_estimada: '2026-08-05', Fecha_fin: null, total: 200000, observaciones: null },
  { ID_ORDEN_SERVICIO: '2', ID_CLIENTES: '200', ID_TECNICOS: '5', ID_MOTOS: '20', Estado: 'En proceso', Fecha_inicio: '2026-08-02', Fecha_estimada: '2026-08-06', Fecha_fin: null, total: 150000, observaciones: 'Revisar frenos' },
  { ID_ORDEN_SERVICIO: '3', ID_CLIENTES: '100', ID_TECNICOS: '5', ID_MOTOS: '10', Estado: 'Finalizada', Fecha_inicio: '2026-07-01', Fecha_estimada: '2026-07-03', Fecha_fin: new Date().toISOString(), total: 100000, observaciones: null },
];

const mockClientes = [
  { ID_CLIENTES: '100', Nombre: 'Juan Pérez' },
  { ID_CLIENTES: '200', Nombre: 'María Gómez' },
];

const mockInformes = [
  { id_informe: 1, id_orden: '3', diagnostico: 'Motor fallando', trabajo_realizado: 'Cambio de bujías', recomendaciones: 'Revisión en 500 km', fecha: '2026-08-20T10:00:00' },
];

describe('TecnicoDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_name', 'Carlos Técnico');
    localStorage.setItem('user_id', '5');

    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
    jest.mocked(clienteService.obtenerClientes).mockResolvedValue({ data: mockClientes } as any);
    jest.mocked(informeService.obtenerMisInformes).mockResolvedValue({ data: mockInformes } as any);
    jest.mocked(ordenService.actualizarOrden).mockResolvedValue({ data: { success: true } } as any);
    jest.mocked(informeService.crearInforme).mockResolvedValue({ data: { success: true } } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. ESTADO DE CARGA
  it('debería mostrar el loader mientras consulta la API', () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockImplementation(() => new Promise(() => {}));
    render(<TecnicoDashboard />);
    expect(screen.getByText(/cargando panel técnico/i)).toBeInTheDocument();
  });

  // 2. HEADER Y ESTADÍSTICAS
  it('debería mostrar el nombre del técnico y las estadísticas calculadas', async () => {
    render(<TecnicoDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/panel de carlos técnico/i)).toBeInTheDocument();
    });

    const statVals = document.querySelectorAll('.tech-stat-val');
    expect(statVals[0]).toHaveTextContent('1'); // Nuevas (Pendiente)
    expect(statVals[1]).toHaveTextContent('1'); // En Proceso
    expect(statVals[2]).toHaveTextContent('1'); // Completadas Hoy (Fecha_fin reciente)
  });

  // 3. ERROR AL CARGAR
  it('debería mostrar banner de error si falla la carga', async () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockRejectedValue({ response: { data: { message: 'Sin conexión' } } });
    render(<TecnicoDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Sin conexión')).toBeInTheDocument();
    });
  });

  // 4. TARJETAS DE ÓRDENES CON ACCIONES POR ESTADO
  it('debería mostrar las órdenes con clientes resueltos y acciones según estado', async () => {
    render(<TecnicoDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
      expect(screen.getByText('María Gómez')).toBeInTheDocument();
    });

    const cards = document.querySelectorAll('.orden-card');
    expect(cards).toHaveLength(3);

    // Pendiente → Iniciar Trabajo
    expect(within(cards[0] as HTMLElement).getByRole('button', { name: /iniciar trabajo/i })).toBeInTheDocument();
    // En Proceso → Redactar Informe
    expect(within(cards[1] as HTMLElement).getByRole('button', { name: /redactar informe/i })).toBeInTheDocument();
    // Finalizada → solo Ver Detalles
    expect(within(cards[2] as HTMLElement).getByRole('button', { name: /ver detalles/i })).toBeInTheDocument();
    expect(within(cards[2] as HTMLElement).queryByRole('button', { name: /iniciar trabajo/i })).not.toBeInTheDocument();
  });

  // 5. BÚSQUEDA EN EL PANEL DE ÓRDENES
  it('debería filtrar las tarjetas al buscar por cliente', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(document.querySelectorAll('.orden-card').length).toBe(3));

    fireEvent.change(screen.getByPlaceholderText(/buscar por cliente o número de orden/i), { target: { value: 'María' } });

    await waitFor(() => {
      expect(document.querySelectorAll('.orden-card').length).toBe(1);
      expect(screen.getByText('María Gómez')).toBeInTheDocument();
    });
  });

  // 6. FILTRO POR CHIPS DE ESTADO
  it('debería filtrar las órdenes al hacer clic en el chip Finalizadas', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(document.querySelectorAll('.orden-card').length).toBe(3));

    fireEvent.click(screen.getByText('Finalizadas'));

    await waitFor(() => {
      expect(document.querySelectorAll('.orden-card').length).toBe(1);
      expect(screen.getByText('Ver Detalles')).toBeInTheDocument();
    });
  });

  // 7. INICIAR TRABAJO (CAMBIO DE ESTADO)
  it('debería actualizar el estado a "En proceso" tras confirmar', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /iniciar trabajo/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /iniciar trabajo/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Actualizar estado?' }));
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ Estado: 'En proceso' })
      );
      expect(Swal.fire).toHaveBeenCalledWith('✅ Actualizado', expect.stringContaining('En proceso'), 'success');
    });
  });

  // 8. CANCELAR CAMBIO DE ESTADO
  it('no debería actualizar el estado si se cancela', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /iniciar trabajo/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /iniciar trabajo/i }));

    await waitFor(() => {
      expect(ordenService.actualizarOrden).not.toHaveBeenCalled();
    });
  });

  // 9. MODAL DE DETALLE CON SERVICIOS Y MOTO
  it('debería mostrar el detalle de la orden con servicios y datos de la moto', async () => {
    jest.mocked(ordenService.obtenerDetallesPorOrden).mockResolvedValue({
      data: { data: [{ ID_DETALLES_ORDEN_SERVICIO: 1, NombreServicio: 'Mantenimiento', NombreProducto: null, cantidad: 1, Precio: 100000, subtotal: 100000 }] },
    } as any);
    jest.mocked(motoService.obtenerMotoPorId).mockResolvedValue({
      data: { data: { Placa: 'ABC12D', Marca: 'KTM', Modelo: 'Duke 390', Cilindraje: 390, Kilometraje: 15000 } },
    } as any);

    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Detalles' }).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: 'Detalles' })[0]);

    await waitFor(() => {
      expect(screen.getByText(/detalle — orden-1/i)).toBeInTheDocument();
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });
  });

  // 10. VALIDACIÓN DEL FORMULARIO DE INFORME
  it('debería exigir diagnóstico o trabajo realizado al guardar el informe', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /redactar informe/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /redactar informe/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar informe/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Atención',
        'Escribe al menos el diagnóstico o el trabajo realizado.',
        'warning'
      );
      expect(informeService.crearInforme).not.toHaveBeenCalled();
    });
  });

  // 11. GUARDAR INFORME Y FINALIZAR ORDEN
  it('debería crear el informe y marcar la orden como Finalizada', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /redactar informe/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /redactar informe/i }));

    fireEvent.change(screen.getByPlaceholderText(/describe el problema/i), { target: { value: 'Frenos desgastados' } });
    fireEvent.change(screen.getByPlaceholderText(/detalla el trabajo/i), { target: { value: 'Cambio de pastillas' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar informe/i }));

    await waitFor(() => {
      expect(informeService.crearInforme).toHaveBeenCalledWith(
        expect.objectContaining({
          id_orden: 2,
          id_tecnico: 5, // user_id del localStorage
          diagnostico: 'Frenos desgastados',
          trabajo_realizado: 'Cambio de pastillas',
        })
      );
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({ Estado: 'Finalizada' })
      );
      expect(Swal.fire).toHaveBeenCalledWith('✅ Informe guardado', expect.any(String), 'success');
    });
  });

  // 12. NAVEGACIÓN A INVENTARIO E INFORMES
  it('debería navegar a inventario y a informes con sus botones', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /inventario/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /inventario/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/tecnico/inventario');

    fireEvent.click(screen.getByRole('button', { name: /mis informes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/tecnico/informes');
  });

  // 13. CIERRE DE SESIÓN
  it('debería cerrar sesión tras confirmar', async () => {
    render(<TecnicoDashboard />);
    await waitFor(() => expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /salir/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Cerrar sesión?' }));
      expect(authService.clearSession).toHaveBeenCalled();
    });
  });
});



