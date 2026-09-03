import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableMotos from '../../src/componentes/TableMotos/Motos';
import { obtenerMotos, insertarMoto, actualizarMoto, eliminarMoto } from '../../src/services/moto.service';
import { obtenerClientes } from '../../src/services/cliente.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/moto.service', () => ({
  obtenerMotos: vi.fn(),
  insertarMoto: vi.fn(),
  actualizarMoto: vi.fn(),
  eliminarMoto: vi.fn()
}));

vi.mock('../../src/services/cliente.service', () => ({
  obtenerClientes: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('TableMotos', () => {
  const mockMotos = [
    { ID_MOTOS: 1, ID_CLIENTES: 1, Placa: 'ABC-123', Modelo: '2020', Marca: 'KTM', Recorrido: 1000 },
    { ID_MOTOS: 2, ID_CLIENTES: 2, Placa: 'XYZ-987', Modelo: '2022', Marca: 'KTM', Recorrido: 5000 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerMotos).mockResolvedValue({ data: { success: true, data: mockMotos } } as any);
    vi.mocked(obtenerClientes).mockResolvedValue({ data: { success: true, data: [{ ID_CLIENTES: 1, Nombre: 'Cliente 1' }] } } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <TableMotos />
    </MemoryRouter>
  );

  it('should render the list of motos', async () => {
    renderComponent();
    expect(screen.getByText('Cargando motos...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando motos...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('XYZ-987')).toBeInTheDocument();
  });

  it('should filter motos by search term', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABC-123')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: 'XYZ' } });
    
    const searchBtn = screen.getByTitle('Buscar');
    fireEvent.click(searchBtn);
    
    expect(screen.queryByText('ABC-123')).not.toBeInTheDocument();
    expect(screen.getByText('XYZ-987')).toBeInTheDocument();
  });

  it('should handle creating a new moto', async () => {
    vi.mocked(insertarMoto).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('ABC-123')).toBeInTheDocument());
    
    // Open create modal
    fireEvent.click(screen.getByText(/Nueva Moto/i));
    
    await waitFor(() => {
      expect(screen.getByText('Registrar Nueva Moto')).toBeInTheDocument();
    });
    
    // Fill form
    fireEvent.change(screen.getByLabelText('ID Moto'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Placa'), { target: { value: 'NEW-123' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: '2023' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByLabelText('Recorrido (km)'), { target: { value: '100' } });
    
    // Submit
    fireEvent.click(screen.getByText('Registrar Moto'));
    
    await waitFor(() => {
      expect(insertarMoto).toHaveBeenCalledWith(expect.objectContaining({
        ID_MOTOS: '3',
        Placa: 'NEW-123'
      }));
    });
  });

  it('should handle deleting a moto', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarMoto).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('ABC-123')).toBeInTheDocument());
    
    const deleteBtns = screen.getAllByText('🗑️ Eliminar');
    fireEvent.click(deleteBtns[0]);
    
    await waitFor(() => {
      expect(eliminarMoto).toHaveBeenCalledWith(1);
    });
  });
});
