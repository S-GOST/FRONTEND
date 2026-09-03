import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Servicios from '../../src/componentes/TableServicios/Servicios';
import { obtenerServicios, insertarServicio, actualizarServicio, eliminarServicio, habilitarServicio } from '../../src/services/servicio.service';
import { obtenerCategoriasPorTipo } from '../../src/services/categoria.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/servicio.service', () => ({
  obtenerServicios: vi.fn(),
  insertarServicio: vi.fn(),
  actualizarServicio: vi.fn(),
  eliminarServicio: vi.fn(),
  habilitarServicio: vi.fn()
}));
vi.mock('../../src/services/categoria.service', () => ({ obtenerCategoriasPorTipo: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('Servicios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerCategoriasPorTipo).mockResolvedValue({ data: [{ ID_CATEGORIA: 1, nombre: 'Categoria 1' }] } as any);
    vi.mocked(obtenerServicios).mockResolvedValue({ data: [
      { ID_SERVICIOS: '1', ID_CATEGORIA: 1, Nombre: 'Servicio 1', Estado: 'Disponible', Precio: 1000 },
      { ID_SERVICIOS: '2', ID_CATEGORIA: 1, Nombre: 'Servicio 2', Estado: 'Inactivo', Precio: 2000 }
    ] } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <Servicios />
    </MemoryRouter>
  );

  it('renders services table', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Servicio 1')).toBeInTheDocument();
      expect(screen.getByText('Servicio 2')).toBeInTheDocument();
    });
  });

  it('searches for services', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Servicio 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Buscar por/i);
    fireEvent.change(searchInput, { target: { value: 'Servicio 2' } });
    
    const searchBtn = screen.getByTitle('Buscar');
    fireEvent.click(searchBtn);

    expect(screen.queryByText('Servicio 1')).not.toBeInTheDocument();
    expect(screen.getByText('Servicio 2')).toBeInTheDocument();

    const resetBtn = screen.getByText(/Reset/i);
    fireEvent.click(resetBtn);
    expect(screen.getByText('Servicio 1')).toBeInTheDocument();
  });

  it('opens create modal and submits new service', async () => {
    vi.mocked(insertarServicio).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Servicio 1')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Nuevo Servicio/i));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Crear Servicio/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/ID Servicio/i), { target: { value: '99' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Servicio Nuevo' } });
    fireEvent.change(screen.getByLabelText(/Precio/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/Categoría/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'Disponible' } });

    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(insertarServicio).toHaveBeenCalledWith(expect.objectContaining({
        ID_SERVICIOS: '99',
        Nombre: 'Servicio Nuevo',
        Precio: 5000,
        ID_CATEGORIA: 1
      }));
    });
  });

  it('opens edit modal and updates service', async () => {
    vi.mocked(actualizarServicio).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Servicio 1')).toBeInTheDocument());

    const editBtns = screen.getAllByTitle('Editar');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar Servicio/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Servicio Modificado' } });
    
    // El botón se llama Guardar cambios
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(actualizarServicio).toHaveBeenCalledWith('1', expect.objectContaining({
        Nombre: 'Servicio Modificado'
      }));
    });
  });

  it('disables service', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarServicio).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Servicio 1')).toBeInTheDocument());

    const disableBtn = screen.getByTitle('Inhabilitar');
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(eliminarServicio).toHaveBeenCalledWith('1');
    });
  });

  it('enables service', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(habilitarServicio).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Servicio 2')).toBeInTheDocument());

    const enableBtn = screen.getByTitle('Habilitar');
    fireEvent.click(enableBtn);

    await waitFor(() => {
      expect(habilitarServicio).toHaveBeenCalledWith('2');
    });
  });
});
