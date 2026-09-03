import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrdenesServicio from '../../src/componentes/TableOrdenServicios/OrdenesServicio';
import { obtenerOrdenes, insertarOrden, actualizarOrden, eliminarOrden } from '../../src/services/ordenServicioService';
import { obtenerClientes } from '../../src/services/cliente.service';
import { obtenerTecnicos } from '../../src/services/tecnico.service';
import { obtenerMotos } from '../../src/services/moto.service';
import { obtenerAdmins } from '../../src/services/admin.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/ordenServicioService', () => ({
  obtenerOrdenes: vi.fn(),
  insertarOrden: vi.fn(),
  actualizarOrden: vi.fn(),
  eliminarOrden: vi.fn()
}));
vi.mock('../../src/services/cliente.service', () => ({ obtenerClientes: vi.fn() }));
vi.mock('../../src/services/tecnico.service', () => ({ obtenerTecnicos: vi.fn() }));
vi.mock('../../src/services/moto.service', () => ({ obtenerMotos: vi.fn() }));
vi.mock('../../src/services/admin.service', () => ({ obtenerAdmins: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('OrdenesServicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerOrdenes).mockResolvedValue({ data: { data: [
      { ID_ORDEN_SERVICIO: '1', ID_CLIENTES: '1', Estado: 'Pendiente', Fecha_inicio: '2023-01-01', Fecha_estimada: '2023-01-05' }
    ] } } as any);
    vi.mocked(obtenerClientes).mockResolvedValue({ data: { data: [{ ID_CLIENTES: '1', Nombre: 'Cliente 1' }] } } as any);
    vi.mocked(obtenerTecnicos).mockResolvedValue({ data: { data: [{ ID_TECNICOS: '1', Nombre: 'Tecnico 1' }] } } as any);
    vi.mocked(obtenerMotos).mockResolvedValue({ data: { data: [{ ID_MOTOS: '1', Placa: 'XYZ123', Modelo: '2020' }] } } as any);
    vi.mocked(obtenerAdmins).mockResolvedValue({ data: { data: [] } } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <OrdenesServicio />
    </MemoryRouter>
  );

  it('should render orders list', async () => {
    renderComponent();
    expect(screen.getByText('Cargando órdenes de servicio...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando órdenes de servicio...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Cliente 1')).toBeInTheDocument();
  });

  it('should handle search', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: '999' } });
    
    const searchBtn = screen.getByRole('button', { name: /Buscar/i });
    fireEvent.click(searchBtn);
    
    expect(screen.queryByText('Cliente 1')).not.toBeInTheDocument();
    expect(screen.getByText('No hay órdenes que coincidan')).toBeInTheDocument();
  });

  it('should open create modal and submit', async () => {
    vi.mocked(insertarOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Nueva Orden/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Orden de Servicio')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText(/Cliente \*/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Fecha inicio \*/i), { target: { value: '2023-02-01' } });
    fireEvent.change(screen.getByLabelText(/Fecha estimada \*/i), { target: { value: '2023-02-05' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Crear orden/i }));
    
    await waitFor(() => {
      expect(insertarOrden).toHaveBeenCalledWith(expect.objectContaining({
        ID_CLIENTES: '1',
        Fecha_inicio: '2023-02-01',
        Fecha_estimada: '2023-02-05'
      }));
    });
  });

  it('should assign a technician', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: '1' } as any);
    vi.mocked(actualizarOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());
    
    const assignBtn = screen.getByTitle('Asignar Técnico');
    fireEvent.click(assignBtn);
    
    await waitFor(() => {
      expect(actualizarOrden).toHaveBeenCalledWith('1', expect.objectContaining({
        ID_TECNICOS: '1'
      }));
    });
  });

  it('should delete order', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());
    
    const deleteBtn = screen.getByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(eliminarOrden).toHaveBeenCalledWith('1');
    });
  });
});
