import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AsignacionTecnicos from '../../src/componentes/TableOrdenServicios/AsignacionTecnicos';
import * as ordenService from '../../src/services/ordenServicioService';
import * as clienteService from '../../src/services/cliente.service';
import * as tecnicoService from '../../src/services/tecnico.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
Mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: { fecha: '2026-08-20', garantiaProductos: '30', garantiaServicios: '' } }),
}));

// Mock del componente FormattedId
Mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
Mock('../../src/services/ordenServicioService');
Mock('../../src/services/cliente.service');
Mock('../../src/services/tecnico.service');

// ==================== DATOS DE PRUEBA ====================
const mockOrdenes = [
  { ID_ORDEN_SERVICIO: '1', ID_CLIENTES: '100', ID_TECNICOS: null, ID_MOTOS: '10', ID_ADMINISTRADOR: '1', Estado: 'Pendiente', Fecha_inicio: '2026-08-01', Fecha_estimada: null, observaciones: null, ClienteNombre: 'Juan Pérez' },
  { ID_ORDEN_SERVICIO: '2', ID_CLIENTES: '200', ID_TECNICOS: '5', ID_MOTOS: '20', ID_ADMINISTRADOR: '1', Estado: 'En Proceso', Fecha_inicio: '2026-08-02', Fecha_estimada: '2026-08-10', observaciones: null, ClienteNombre: 'María Gómez' },
  { ID_ORDEN_SERVICIO: '3', ID_CLIENTES: '100', ID_TECNICOS: '5', ID_MOTOS: '10', ID_ADMINISTRADOR: '1', Estado: 'Finalizado', Fecha_inicio: '2026-07-01', Fecha_estimada: '2026-07-05', observaciones: 'Orden entregada sin novedad', ClienteNombre: 'Juan Pérez' },
  { ID_ORDEN_SERVICIO: '4', ID_CLIENTES: '200', ID_TECNICOS: '6', ID_MOTOS: '20', ID_ADMINISTRADOR: '1', Estado: 'Finalizado', Fecha_inicio: '2026-07-02', Fecha_estimada: '2026-07-06', observaciones: null, ClienteNombre: 'María Gómez' },
];

const mockClientes = [
  { ID_CLIENTES: 100, Nombre: 'Juan Pérez' },
  { ID_CLIENTES: 200, Nombre: 'María Gómez' },
];

const mockTecnicos = [
  { ID_TECNICOS: '5', Nombre: 'Carlos Ruiz' },
  { ID_TECNICOS: '6', Nombre: 'Ana Torres' },
];

describe('AsignacionTecnicos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(ordenService.obtenerOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
    jest.mocked(clienteService.obtenerClientes).mockResolvedValue({ data: mockClientes } as any);
    jest.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue({ data: mockTecnicos } as any);
  });

  // 1. ESTADO DE CARGA
  it('debería mostrar el loader mientras consulta la API', () => {
    jest.mocked(ordenService.obtenerOrdenes).mockImplementation(() => new Promise(() => {}));
    render(<AsignacionTecnicos />);
    expect(screen.getByText(/cargando órdenes de servicio/i)).toBeInTheDocument();
  });

  // 2. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(ordenService.obtenerOrdenes).mockRejectedValue(new Error('Fallo'));
    render(<AsignacionTecnicos />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los datos.', icon: 'error' })
      );
    });
  });

  // 3. HEADER Y ESTADÍSTICAS
  it('debería mostrar el título y las estadísticas calculadas', async () => {
    render(<AsignacionTecnicos />);

    await waitFor(() => {
      expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument();
    });

    const statCards = document.querySelectorAll('.stat-card .stat-number');
    expect(statCards[0]).toHaveTextContent('1'); // Pendientes
    expect(statCards[1]).toHaveTextContent('1'); // En Proceso
    expect(statCards[2]).toHaveTextContent('2'); // Finalizadas
    expect(statCards[3]).toHaveTextContent('4'); // Total
  });

  // 4. TABLERO KANBAN CON LAS 3 COLUMNAS
  it('debería clasificar las órdenes en las columnas correctas', async () => {
    render(<AsignacionTecnicos />);

    await waitFor(() => {
      // Columna Pendientes: orden sin técnico
      expect(screen.getByText('Sin técnico asignado')).toBeInTheDocument();
      // Columna En Proceso: técnico asignado
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
      // Columna Finalizadas: observaciones visibles
      expect(screen.getByText('Orden entregada sin novedad')).toBeInTheDocument();
    });

    // Nombres de clientes resueltos
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('María Gómez').length).toBeGreaterThan(0);
  });

  // 5. BOTÓN ASIGNAR DESHABILITADO SIN TÉCNICO
  it('debería deshabilitar el botón Asignar hasta seleccionar técnico', async () => {
    render(<AsignacionTecnicos />);
    await waitFor(() => expect(screen.getByText('Sin técnico asignado')).toBeInTheDocument());

    const btnAsignar = screen.getByRole('button', { name: /asignar$/i });
    expect(btnAsignar).toBeDisabled();
  });

  // 6. ASIGNAR TÉCNICO A ORDEN PENDIENTE
  it('debería asignar el técnico seleccionado y actualizar la orden', async () => {
    jest.mocked(ordenService.actualizarOrden).mockResolvedValue({ data: { success: true } } as any);
    const { container } = render(<AsignacionTecnicos />);
    await waitFor(() => expect(screen.getByText('Sin técnico asignado')).toBeInTheDocument());

    // Seleccionar técnico en el select de la orden pendiente
    const select = container.querySelectorAll('.tech-select')[0] as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '5' } });

    const btnAsignar = screen.getByRole('button', { name: /asignar$/i });
    expect(btnAsignar).not.toBeDisabled();
    fireEvent.click(btnAsignar);

    await waitFor(() => {
      // Confirmación mostrada
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¿Confirmar asignación?' })
      );
      // Se actualizó la orden con el técnico y la fecha del Swal
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          ID_TECNICOS: '5',
          Estado: 'Pendiente',
          Fecha_estimada: '2026-08-20',
          garantia_productos: 30,
        })
      );
      // Alerta de éxito
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¡Asignado!', icon: 'success' })
      );
    });
  });

  // 7. BÚSQUEDA POR TÉCNICO
  it('debería filtrar las órdenes al buscar por nombre de técnico', async () => {
    render(<AsignacionTecnicos />);
    await waitFor(() => expect(screen.getByText('Sin técnico asignado')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, cliente o técnico/i), { target: { value: 'Carlos' } });

    await waitFor(() => {
      // La orden pendiente desaparece (su técnico no coincide)
      expect(screen.queryByText('Sin técnico asignado')).not.toBeInTheDocument();
      expect(screen.getByText(/no hay órdenes pendientes/i)).toBeInTheDocument();
      // La orden de Carlos sigue visible
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    });
  });

  // 8. FILTROS DE COLUMNAS
  it('debería mostrar solo la columna seleccionada con los filtros', async () => {
    render(<AsignacionTecnicos />);
    await waitFor(() => expect(document.querySelectorAll('.kanban-column').length).toBe(3));

    // Filtro Pendientes → solo 1 columna
    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));
    expect(document.querySelectorAll('.kanban-column').length).toBe(1);
    expect(document.querySelector('.column-pending')).toBeInTheDocument();
    expect(document.querySelector('.column-assigned')).not.toBeInTheDocument();

    // Filtro Completadas → solo columna de finalizadas
    fireEvent.click(screen.getByRole('button', { name: 'Completadas' }));
    expect(document.querySelectorAll('.kanban-column').length).toBe(1);
    expect(document.querySelector('.column-completed')).toBeInTheDocument();
  });

  // 9. AGREGAR OBSERVACIONES A ORDEN FINALIZADA
  it('debería guardar observaciones en una orden finalizada sin ellas', async () => {
    jest.mocked(ordenService.actualizarOrden).mockResolvedValue({ data: { success: true } } as any);
    jest.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true, value: 'Revisar frenos' } as any);

    render(<AsignacionTecnicos />);
    await waitFor(() => expect(screen.getByText('Agregar Observaciones')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Agregar Observaciones'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Observaciones / Garantía', input: 'textarea' })
      );
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith('4', { observaciones: 'Revisar frenos' });
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Guardado', icon: 'success' })
      );
    });
  });

  // 10. NO GUARDAR OBSERVACIONES SI SE CANCELA
  it('no debería guardar observaciones si el usuario cancela', async () => {
    jest.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false, value: undefined } as any);

    render(<AsignacionTecnicos />);
    await waitFor(() => expect(screen.getByText('Agregar Observaciones')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Agregar Observaciones'));

    await waitFor(() => {
      expect(ordenService.actualizarOrden).not.toHaveBeenCalled();
    });
  });
});



