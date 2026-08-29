import { MemoryRouter } from 'react-router-dom';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetallesOrden from '../../src/componentes/TableOrdenServicios/DetallesOrden';
import * as detalleService from '../../src/services/detalleOrdenServicioService';
import * as servicioService from '../../src/services/servicio.service';
import * as productoService from '../../src/services/producto.service';
import * as ordenService from '../../src/services/ordenServicioService';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }), getInput: vi.fn() } }));

vi.mock('react-router-dom', async () => {
  const mod = await vi.importActual('react-router-dom');
  const React = await import('react');
  return {
    ...mod,
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useNavigate: vi.fn(),
  };
});

// Mock del componente FormattedId
vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/detalleOrdenServicioService');
vi.mock('../../src/services/servicio.service');
vi.mock('../../src/services/producto.service');
vi.mock('../../src/services/ordenServicioService');

// ==================== DATOS DE PRUEBA ====================
const mockDetalles = [
  { ID_DETALLES_ORDEN_SERVICIO: 1, ID_ORDEN_SERVICIO: 10, ID_SERVICIOS: 5, ID_PRODUCTOS: null, Garantia: 6, Precio: 150000, Estado: 'Activo' },
  { ID_DETALLES_ORDEN_SERVICIO: 2, ID_ORDEN_SERVICIO: 10, ID_SERVICIOS: null, ID_PRODUCTOS: 20, Garantia: null, Precio: 50000, Estado: 'Activo' },
];
const mockOrdenes = [{ ID_ORDEN_SERVICIO: 10, ClienteNombre: 'Juan Pérez', Fecha_inicio: '2026-08-01' }];
const mockServicios = [{ ID_SERVICIOS: 5, Nombre: 'Mantenimiento' }];
const mockProductos = [{ ID_PRODUCTOS: 20, Nombre: 'Aceite' }];

describe('DetallesOrden Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detalleService.obtenerDetallesOrdenes).mockResolvedValue({ data: mockDetalles } as any);
    vi.mocked(ordenService.obtenerOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: mockServicios } as any);
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: mockProductos } as any);
  });

  // 1. ESTADO DE CARGA
  it('debería mostrar el loader mientras consulta la API', () => {
    vi.mocked(detalleService.obtenerDetallesOrdenes).mockImplementation(() => new Promise(() => {}));
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    expect(screen.getByText(/cargando detalles de orden/i)).toBeInTheDocument();
  });

  // 2. ERROR AL CARGAR
  it('debería mostrar banner y alerta de error si falla la carga', async () => {
    vi.mocked(detalleService.obtenerDetallesOrdenes).mockRejectedValue(new Error('Fallo'));
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar los datos necesarios.')).toBeInTheDocument();
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', icon: 'error' })
      );
    });
  });

  // 3. TABLA CON DATOS Y FALLBACKS
  it('debería mostrar los detalles con precios formateados y fallbacks "-"', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText((150000).toLocaleString('es-CO'))).toBeInTheDocument();
      expect(screen.getByText((50000).toLocaleString('es-CO'))).toBeInTheDocument();
    });

    // Garantía del detalle 1
    expect(screen.getByText('6')).toBeInTheDocument();
    // Fallbacks del detalle 2 (sin servicio, sin garantía)
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
  });

  // 4. ENLACE VOLVER
  it('debería tener el enlace para volver a órdenes de servicio', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Detalles de Orden de Servicio')).toBeInTheDocument());

    expect(screen.getByRole('link', { name: /volver a órdenes de servicio/i }))
      .toHaveAttribute('href', '/admin/ordenes_servicio');
  });

  // 5. BÚSQUEDA POR ID
  it('debería filtrar detalles al buscar por ID', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByTestId('formatted-id').length).toBeGreaterThan(0));

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, orden/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      // Solo queda el detalle 2 (su producto es 20, que también contiene "2")
      expect(screen.getByText((50000).toLocaleString('es-CO'))).toBeInTheDocument();
      expect(screen.queryByText((150000).toLocaleString('es-CO'))).not.toBeInTheDocument();
    });
  });

  // 6. MODAL DE CREACIÓN CON SELECTS POBLADOS
  it('debería abrir el modal con las órdenes, servicios y productos disponibles', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /nuevo detalle/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo detalle/i }));

    expect(screen.getByText('Nuevo Detalle de Orden')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/10 - Juan Pérez/)).toBeInTheDocument();
      expect(screen.getByText(/5 - Mantenimiento/)).toBeInTheDocument();
      expect(screen.getByText(/20 - Aceite/)).toBeInTheDocument();
    });
  });

  // 7. VALIDACIÓN: ID DUPLICADO
  it('debería rechazar un ID de detalle que ya existe', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /nuevo detalle/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo detalle/i }));
    const modal = screen.getByText('Nuevo Detalle de Orden').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="ID_DETALLES_ORDEN_SERVICIO"]')!, { target: { value: '1' } });
    fireEvent.change(modal.querySelector('select[name="ID_ORDEN_SERVICIO"]')!, { target: { value: '10' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { value: '1000' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'El ID "1" ya existe. Use uno diferente.', icon: 'error' })
      );
      expect(detalleService.insertarDetalleOrden).not.toHaveBeenCalled();
    });
  });

  // 8. VALIDACIÓN: SERVICIO O PRODUCTO OBLIGATORIO
  it('debería exigir al menos un servicio o producto', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /nuevo detalle/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo detalle/i }));
    const modal = screen.getByText('Nuevo Detalle de Orden').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="ID_DETALLES_ORDEN_SERVICIO"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_ORDEN_SERVICIO"]')!, { target: { value: '10' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'Debe seleccionar al menos un servicio o un producto', icon: 'error' })
      );
    });
  });

  // 9. CREAR DETALLE EXITOSAMENTE
  it('debería crear el detalle con el payload correcto', async () => {
    vi.mocked(detalleService.insertarDetalleOrden).mockResolvedValue({ data: { success: true } } as any);
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /nuevo detalle/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo detalle/i }));
    const modal = screen.getByText('Nuevo Detalle de Orden').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="ID_DETALLES_ORDEN_SERVICIO"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_ORDEN_SERVICIO"]')!, { target: { value: '10' } });
    fireEvent.change(modal.querySelector('select[name="ID_SERVICIOS"]')!, { target: { value: '5' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { value: '100000' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(detalleService.insertarDetalleOrden).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_DETALLES_ORDEN_SERVICIO: 3,
          ID_ORDEN_SERVICIO: 10,
          ID_SERVICIOS: 5,
          ID_PRODUCTOS: null,
          Precio: 100000,
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Creado', icon: 'success' })
      );
    });
  });

  // 10. MODAL DE EDICIÓN CON ID BLOQUEADO
  it('debería abrir la edición con el ID deshabilitado y los datos cargados', async () => {
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /editar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

    expect(screen.getByText('Editar Detalle')).toBeInTheDocument();
    const modal = screen.getByText('Editar Detalle').closest('.modal-container') as HTMLElement;

    const idInput = modal.querySelector('input[name="ID_DETALLES_ORDEN_SERVICIO"]') as HTMLInputElement;
    expect(idInput).toBeDisabled();
    expect(idInput.value).toBe('1');
    expect(modal.querySelector('input[name="Garantia"]')).toHaveValue(6);
  });

  // 11. ACTUALIZAR DETALLE
  it('debería actualizar el detalle y mostrar alerta de éxito', async () => {
    vi.mocked(detalleService.actualizarDetalleOrden).mockResolvedValue({ data: { success: true } } as any);
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /editar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);
    const modal = screen.getByText('Editar Detalle').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="Garantia"]')!, { target: { value: '12' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(detalleService.actualizarDetalleOrden).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ Garantia: 12, ID_SERVICIOS: 5 })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Actualizado', icon: 'success' })
      );
    });
  });

  // 12. ELIMINAR DETALLE
  it('debería eliminar el detalle tras confirmar', async () => {
    vi.mocked(detalleService.eliminarDetalleOrden).mockResolvedValue({ data: { success: true } } as any);
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /eliminar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¿Eliminar detalle 1?', icon: 'warning' })
      );
      expect(detalleService.eliminarDetalleOrden).toHaveBeenCalledWith(1);
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Eliminado', icon: 'success' })
      );
    });
  });

  // 13. ELIMINAR CANCELADO
  it('no debería eliminar si se cancela la confirmación', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<MemoryRouter><DetallesOrden /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /eliminar/i }).length).toBe(2));

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(detalleService.eliminarDetalleOrden).not.toHaveBeenCalled();
    });
  });
});



