import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest'; // Importar vi
import OrdenesServicio from '../../src/componentes/TableOrdenServicios/OrdenesServicio';
import * as ordenService from '../../src/services/ordenServicioService';
import * as clienteService from '../../src/services/cliente.service';
import * as tecnicoService from '../../src/services/tecnico.service';
import * as motoService from '../../src/services/moto.service';
import * as adminService from '../../src/services/admin.service';
import Swal from 'sweetalert2';

// ==================== MOCKS ====================

vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }),
  getInput: vi.fn(),
}));

vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

vi.mock('../../src/services/ordenServicioService');
vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/tecnico.service');
vi.mock('../../src/services/moto.service');
vi.mock('../../src/services/admin.service');

// ==================== DATA MOCK ====================

const mockOrdenes = [
  {
    ID_ORDEN_SERVICIO: '1',
    ID_CLIENTES: '100',
    ID_ADMINISTRADOR: '1',
    ID_TECNICOS: '',
    ID_MOTOS: '10',
    Fecha_inicio: '2026-08-01',
    Fecha_estimada: '2026-08-05',
    Fecha_fin: '',
    Estado: 'Pendiente',
    ClienteNombre: 'Juan Pérez',
    detalles: [
      {
        id_detalle: 1,
        NombreServicio: 'Mantenimiento',
        NombreProducto: null,
        cantidad: 1,
        subtotal: 150000,
      },
    ],
  },
  {
    ID_ORDEN_SERVICIO: '2',
    ID_CLIENTES: '200',
    ID_ADMINISTRADOR: '1',
    ID_TECNICOS: '5',
    ID_MOTOS: '20',
    Fecha_inicio: '2026-08-10',
    Fecha_estimada: '2026-08-15',
    Fecha_fin: '2026-08-14',
    Estado: 'Completado',
    ClienteNombre: 'María Gómez',
    detalles: [],
  },
];

const mockClientes = [
  { ID_CLIENTES: '100', Nombre: 'Juan Pérez' },
  { ID_CLIENTES: '200', Nombre: 'María Gómez' },
];

const mockTecnicos = [
  { ID_TECNICOS: '5', Nombre: 'Carlos Ruiz' },
  { ID_TECNICOS: '6', Nombre: 'Ana Torres' },
];

const mockMotos = [
  { ID_MOTOS: '10', Placa: 'ABC12D', Modelo: 'Duke 390' },
  { ID_MOTOS: '20', Placa: 'XYZ34E', Modelo: 'FZ 2.0' },
];

const mockAdmins = [
  { ID_ADMINISTRADOR: '1', Nombre: 'Admin Principal' },
];

describe('OrdenesServicio Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Cambio: jest -> vi

    vi.mocked(ordenService.obtenerOrdenes).mockResolvedValue({
      data: mockOrdenes,
    } as any);

    vi.mocked(clienteService.obtenerClientes).mockResolvedValue({
      data: mockClientes,
    } as any);

    vi.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue({
      data: mockTecnicos,
    } as any);

    vi.mocked(motoService.obtenerMotos).mockResolvedValue({
      data: mockMotos,
    } as any);

    vi.mocked(adminService.obtenerAdmins).mockResolvedValue({
      data: mockAdmins,
    } as any);
  });

  // 1. LOADING
  it('debería mostrar el estado de carga mientras consulta los datos', () => {
    vi.mocked(ordenService.obtenerOrdenes).mockImplementation(() => new Promise(() => {}));

    render(<OrdenesServicio />);

    expect(screen.getByText(/cargando órdenes de servicio/i)).toBeInTheDocument();
  });

  // 2. RENDER INICIAL
  it('debería renderizar el título, subtítulo y acciones principales', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => {
      expect(screen.getByText('Órdenes de Servicio')).toBeInTheDocument();
    });

    expect(screen.getByText('Gestión completa de órdenes (CRUD)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por id, cliente, técnico o moto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 3. CARGA DE SERVICIOS
  it('debería cargar órdenes, clientes, técnicos, motos y admins', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => {
      expect(ordenService.obtenerOrdenes).toHaveBeenCalled();
      expect(clienteService.obtenerClientes).toHaveBeenCalled();
      expect(tecnicoService.obtenerTecnicos).toHaveBeenCalled();
      expect(motoService.obtenerMotos).toHaveBeenCalled();
      expect(adminService.obtenerAdmins).toHaveBeenCalled();
    });
  });

  // 4. TABLA CON DATOS
  it('debería mostrar las órdenes con cliente, técnico, moto y fechas', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María Gómez')).toBeInTheDocument();
    });

    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
    expect(screen.getByText('2026-08-05')).toBeInTheDocument();
    expect(screen.getByText('2026-08-14')).toBeInTheDocument();

    // La orden sin técnico muestra "-"
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  // 5. ERROR DE CARGA
  it('debería mostrar banner y alerta si falla la carga inicial', async () => {
    vi.mocked(ordenService.obtenerOrdenes).mockRejectedValue(new Error('Fallo'));

    render(<OrdenesServicio />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar los datos necesarios.')).toBeInTheDocument();
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudieron cargar los datos.',
          icon: 'error',
        })
      );
    });
  });

  // 6. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay órdenes', async () => {
    vi.mocked(ordenService.obtenerOrdenes).mockResolvedValue({ data: [] } as any);

    render(<OrdenesServicio />);

    await waitFor(() => {
      expect(screen.getByText(/no hay órdenes que coincidan/i)).toBeInTheDocument();
    });
  });

  // 7. BÚSQUEDA POR ID
  it('debería filtrar órdenes por ID', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, cliente/i), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
      expect(screen.getByText('María Gómez')).toBeInTheDocument();
    });
  });

  // 8. RESET DE BÚSQUEDA
  it('debería limpiar la búsqueda con Reset', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/buscar por id, cliente/i);

    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María Gómez')).toBeInTheDocument();
    });
  });

  // 9. MODAL NUEVA ORDEN
  it('debería abrir el modal para crear una nueva orden con selects cargados', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    expect(screen.getByText('Nueva Orden de Servicio')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/100 - Juan Pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/5 - Carlos Ruiz/i)).toBeInTheDocument();
      expect(screen.getByText(/10 - ABC12D/i)).toBeInTheDocument();
    });
  });

  // 10. VALIDACIÓN CLIENTE REQUERIDO
  it('debería mostrar alerta si se intenta crear sin cliente', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    const modal = screen.getByText('Nueva Orden de Servicio').closest('.modal-container') as HTMLElement;

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Campos requeridos',
          text: 'Debe seleccionar un cliente.',
          icon: 'warning',
        })
      );
      expect(ordenService.insertarOrden).not.toHaveBeenCalled();
    });
  });

  // 11. VALIDACIÓN FECHAS REQUERIDAS
  it('debería mostrar alerta si faltan fechas al crear la orden', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    const modal = screen.getByText('Nueva Orden de Servicio').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('select[name="ID_CLIENTES"]')!, {
      target: { value: '100' },
    });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Fechas requeridas',
          text: 'Debe especificar fecha de inicio y fecha estimada.',
          icon: 'warning',
        })
      );
      expect(ordenService.insertarOrden).not.toHaveBeenCalled();
    });
  });

  // 12. CREAR ORDEN EXITOSAMENTE
  it('debería crear una orden con el payload correcto', async () => {
    vi.mocked(ordenService.insertarOrden).mockResolvedValue({
      data: { success: true },
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    const modal = screen.getByText('Nueva Orden de Servicio').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('select[name="ID_CLIENTES"]')!, {
      target: { value: '100' },
    });

    fireEvent.change(modal.querySelector('select[name="ID_TECNICOS"]')!, {
      target: { value: '5' },
    });

    fireEvent.change(modal.querySelector('select[name="ID_MOTOS"]')!, {
      target: { value: '10' },
    });

    fireEvent.change(modal.querySelector('input[name="Fecha_inicio"]')!, {
      target: { value: '2026-09-01' },
    });

    fireEvent.change(modal.querySelector('input[name="Fecha_estimada"]')!, {
      target: { value: '2026-09-05' },
    });

    fireEvent.change(modal.querySelector('select[name="Estado"]')!, {
      target: { value: 'Pendiente' },
    });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(ordenService.insertarOrden).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_CLIENTES: '100',
          ID_TECNICOS: '5',
          ID_MOTOS: '10',
          Fecha_inicio: '2026-09-01',
          Fecha_estimada: '2026-09-05',
          Estado: 'Pendiente',
        })
      );

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Creada',
          text: 'Nueva orden de servicio creada',
          icon: 'success',
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Nueva Orden de Servicio')).not.toBeInTheDocument();
    });
  });

  // 13. ERROR AL CREAR ORDEN
  it('debería mostrar alerta de error si falla la creación', async () => {
    vi.mocked(ordenService.insertarOrden).mockRejectedValue(new Error('Error al crear'));

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getByRole('button', { name: /nueva orden/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    const modal = screen.getByText('Nueva Orden de Servicio').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('select[name="ID_CLIENTES"]')!, {
      target: { value: '100' },
    });

    fireEvent.change(modal.querySelector('input[name="Fecha_inicio"]')!, {
      target: { value: '2026-09-01' },
    });

    fireEvent.change(modal.querySelector('input[name="Fecha_estimada"]')!, {
      target: { value: '2026-09-05' },
    });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudo guardar la orden',
          icon: 'error',
        })
      );
    });
  });

  // 14. VER DETALLES
  it('debería abrir el modal de detalles de una orden', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /ver/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /ver/i })[0]);

    expect(screen.getByText(/detalles de la orden 1/i)).toBeInTheDocument();
    expect(screen.getByText(/cliente:/i)).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('$150.000')).toBeInTheDocument();
  });

  // 15. CERRAR MODAL DE DETALLES
  it('debería cerrar el modal de detalles', async () => {
    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /ver/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /ver/i })[0]);

    expect(screen.getByText(/detalles de la orden 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/detalles de la orden 1/i)).not.toBeInTheDocument();
    });
  });

  // 16. ASIGNACIÓN RÁPIDA DE TÉCNICO
  it('debería asignar rápidamente un técnico a una orden', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: true,
      value: '6',
    } as any);

    vi.mocked(ordenService.actualizarOrden).mockResolvedValue({
      data: { success: true },
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByTitle('Asignar Técnico').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Asignar Técnico')[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Asignar Técnico',
          input: 'select',
        })
      );

      expect(ordenService.actualizarOrden).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          ID_CLIENTES: '100',
          ID_TECNICOS: '6',
          ID_MOTOS: '10',
          Fecha_inicio: '2026-08-01',
          Fecha_estimada: '2026-08-05',
          Estado: 'Pendiente',
        })
      );

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Asignado',
          text: 'Se asignó a Ana Torres correctamente.',
          icon: 'success',
        })
      );
    });
  });

  // 17. DESASIGNAR TÉCNICO
  it('debería desasignar técnico si se selecciona valor vacío', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: true,
      value: '',
    } as any);

    vi.mocked(ordenService.actualizarOrden).mockResolvedValue({
      data: { success: true },
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByTitle('Asignar Técnico').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Asignar Técnico')[1]);

    await waitFor(() => {
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          ID_TECNICOS: '',
        })
      );

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Desasignado',
          text: 'Se ha eliminado la asignación del técnico.',
          icon: 'success',
        })
      );
    });
  });

  // 18. ASIGNACIÓN CANCELADA
  it('no debería actualizar la orden si se cancela la asignación rápida', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: false,
      value: undefined,
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByTitle('Asignar Técnico').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Asignar Técnico')[0]);

    await waitFor(() => {
      expect(ordenService.actualizarOrden).not.toHaveBeenCalled();
    });
  });

  // 19. SIN TÉCNICOS DISPONIBLES
  it('debería mostrar advertencia si no hay técnicos registrados', async () => {
    vi.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue({ data: [] } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByTitle('Asignar Técnico').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Asignar Técnico')[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sin técnicos',
          text: 'No hay técnicos registrados en el sistema.',
          icon: 'warning',
        })
      );

      expect(ordenService.actualizarOrden).not.toHaveBeenCalled();
    });
  });

  // 20. ELIMINAR ORDEN
  it('debería eliminar una orden después de confirmar', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: true,
    } as any);

    vi.mocked(ordenService.eliminarOrden).mockResolvedValue({
      data: { success: true },
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /eliminar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '¿Eliminar orden 1?',
          icon: 'warning',
        })
      );

      expect(ordenService.eliminarOrden).toHaveBeenCalledWith('1');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Eliminada',
          text: 'La orden ha sido eliminada',
          icon: 'success',
        })
      );
    });
  });

  // 21. ELIMINAR CANCELADO
  it('no debería eliminar si se cancela la confirmación', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: false,
    } as any);

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /eliminar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(ordenService.eliminarOrden).not.toHaveBeenCalled();
    });
  });

  // 22. ERROR AL ELIMINAR
  it('debería mostrar alerta de error si falla la eliminación', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({
      isConfirmed: true,
    } as any);

    vi.mocked(ordenService.eliminarOrden).mockRejectedValue(new Error('Fallo eliminando'));

    render(<OrdenesServicio />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /eliminar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudo eliminar la orden',
          icon: 'error',
        })
      );
    });
  });
});