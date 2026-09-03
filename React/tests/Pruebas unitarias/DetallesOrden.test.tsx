import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DetallesOrden from '../../src/componentes/TableOrdenServicios/DetallesOrden';
import { obtenerDetallesOrdenes, insertarDetalleOrden, actualizarDetalleOrden, eliminarDetalleOrden } from '../../src/services/detalleOrdenServicioService';
import { obtenerServicios } from '../../src/services/servicio.service';
import { obtenerProductos } from '../../src/services/producto.service';
import { obtenerOrdenes } from '../../src/services/ordenServicioService';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/detalleOrdenServicioService', () => ({
  obtenerDetallesOrdenes: vi.fn(),
  insertarDetalleOrden: vi.fn(),
  actualizarDetalleOrden: vi.fn(),
  eliminarDetalleOrden: vi.fn()
}));
vi.mock('../../src/services/servicio.service', () => ({ obtenerServicios: vi.fn() }));
vi.mock('../../src/services/producto.service', () => ({ obtenerProductos: vi.fn() }));
vi.mock('../../src/services/ordenServicioService', () => ({ obtenerOrdenes: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('DetallesOrden', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerDetallesOrdenes).mockResolvedValue({ data: { success: true, data: [
      { ID_DETALLES_ORDEN_SERVICIO: 1, ID_ORDEN_SERVICIO: 1, ID_SERVICIOS: 1, Garantia: 6, Precio: 50000 }
    ] } } as any);
    vi.mocked(obtenerOrdenes).mockResolvedValue({ data: { success: true, data: [{ ID_ORDEN_SERVICIO: 1 }] } } as any);
    vi.mocked(obtenerServicios).mockResolvedValue({ data: { success: true, data: [{ ID_SERVICIOS: 1, Nombre: 'Serv 1' }] } } as any);
    vi.mocked(obtenerProductos).mockResolvedValue({ data: { success: true, data: [{ ID_PRODUCTOS: 1, Nombre: 'Prod 1' }] } } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <DetallesOrden />
    </MemoryRouter>
  );

  it('should render details list', async () => {
    renderComponent();
    expect(screen.getByText('Cargando detalles de orden...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando detalles de orden...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('50.000')).toBeInTheDocument();
  });

  it('should create new detail', async () => {
    vi.mocked(insertarDetalleOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Cargando detalles de orden...')).not.toBeInTheDocument());
    
    fireEvent.click(screen.getByText(/Nuevo Detalle/i));
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Detalle de Orden')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('ID Detalle *'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('ID Orden de Servicio *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Servicio/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Precio *'), { target: { value: '10000' } });
    
    fireEvent.click(screen.getByText('Crear detalle'));
    
    await waitFor(() => {
      expect(insertarDetalleOrden).toHaveBeenCalled();
    });
  });

  it('should delete detail', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarDetalleOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Cargando detalles de orden...')).not.toBeInTheDocument());
    
    const delBtns = screen.getAllByText('Eliminar');
    fireEvent.click(delBtns[0]);
    
    await waitFor(() => {
      expect(eliminarDetalleOrden).toHaveBeenCalledWith(1);
    });
  });
});
