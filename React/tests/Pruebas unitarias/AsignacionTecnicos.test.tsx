import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AsignacionTecnicos from '../../src/componentes/TableOrdenServicios/AsignacionTecnicos';
import * as ordenService from '../../src/services/ordenServicioService';
import * as clienteService from '../../src/services/cliente.service';
import * as tecnicoService from '../../src/services/tecnico.service';
import Swal from 'sweetalert2';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: { fecha: '2026-10-10', garantiaProductos: '30', garantiaServicios: '15' } }) }
}));

vi.mock('../../src/services/ordenServicioService');
vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/tecnico.service');
vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>
}));

const mockOrdenes = [
  { ID_ORDEN_SERVICIO: 'ORD-1', ID_CLIENTES: 'CLI-1', ID_TECNICOS: '', Estado: 'Pendiente' },
  { ID_ORDEN_SERVICIO: 'ORD-2', ID_CLIENTES: 'CLI-2', ID_TECNICOS: 'TEC-1', Estado: 'En Proceso' },
  { ID_ORDEN_SERVICIO: 'ORD-3', ID_CLIENTES: 'CLI-1', ID_TECNICOS: 'TEC-2', Estado: 'Finalizado', observaciones: '' },
  { ID_ORDEN_SERVICIO: 'ORD-4', ID_CLIENTES: 'CLI-1', ID_TECNICOS: 'TEC-2', Estado: 'Finalizado', observaciones: 'Todo ok' }
];

const mockClientes = [
  { ID_CLIENTES: 'CLI-1', Nombre: 'Juan Perez' },
  { ID_CLIENTES: 'CLI-2', Nombre: 'Ana Gomez' }
];

const mockTecnicos = [
  { ID_TECNICOS: 'TEC-1', Nombre: 'Tecnico Carlos' },
  { ID_TECNICOS: 'TEC-2', Nombre: 'Tecnico David' }
];

describe('AsignacionTecnicos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ordenService.obtenerOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
    vi.mocked(clienteService.obtenerClientes).mockResolvedValue({ data: mockClientes } as any);
    vi.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue({ data: mockTecnicos } as any);
  });

  const renderComponent = () => render(<MemoryRouter><AsignacionTecnicos /></MemoryRouter>);

  it('debería renderizar loading y luego los kanbans con los datos', async () => {
    renderComponent();
    expect(screen.getByText(/Cargando órdenes/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('formatted-id')).toHaveLength(4);
    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tecnico Carlos').length).toBeGreaterThan(0);
  });

  it('debería mostrar alerta de error si falla la carga', async () => {
    vi.mocked(ordenService.obtenerOrdenes).mockRejectedValue(new Error('API error'));
    renderComponent();

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los datos.' }));
    });
  });

  it('debería permitir filtrar por búsqueda (cliente, tecnico o ID)', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('formatted-id')).toHaveLength(4));

    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    
    // Buscar un cliente
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    expect(screen.getAllByTestId('formatted-id')).toHaveLength(3);

    // Buscar por tecnico
    fireEvent.change(searchInput, { target: { value: 'Carlos' } });
    expect(screen.getAllByTestId('formatted-id')).toHaveLength(1);
  });

  it('debería filtrar por estado de kanban', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const btnPendientes = screen.getByRole('button', { name: /Pendientes/i });
    fireEvent.click(btnPendientes);

    // Solo debería mostrar ORD-1
    expect(screen.getAllByTestId('formatted-id')).toHaveLength(1);
    expect(screen.getByText('ORD-1')).toBeInTheDocument();

    const btnAsignadas = screen.getByRole('button', { name: /Asignadas/i });
    fireEvent.click(btnAsignadas);
    expect(screen.getAllByTestId('formatted-id')).toHaveLength(1);
    expect(screen.getByText('ORD-2')).toBeInTheDocument();
  });

  it('debería asignar un técnico correctamente a una orden pendiente', async () => {
    vi.mocked(ordenService.actualizarOrden).mockResolvedValue({ data: { success: true } } as any);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
    
    // Seleccionar tecnico
    fireEvent.change(selects[0], { target: { value: 'TEC-1' } });
    
    const btnAsignar = screen.getByRole('button', { name: /Asignar/i });
    fireEvent.click(btnAsignar);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Confirmar asignación?' }));
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith('ORD-1', expect.objectContaining({
        ID_TECNICOS: 'TEC-1',
        Estado: 'Pendiente'
      }));
    });
  });

  it('no debería asignar si se cancela en sweetalert', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'TEC-2' } });
    
    const btnAsignar = screen.getByRole('button', { name: /Asignar/i });
    fireEvent.click(btnAsignar);

    await waitFor(() => {
      expect(ordenService.actualizarOrden).not.toHaveBeenCalled();
    });
  });

  it('debería manejar error al asignar técnico', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: {} } as any);
    vi.mocked(ordenService.actualizarOrden).mockRejectedValue(new Error('Falló asignar'));
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'TEC-1' } });
    
    const btnAsignar = screen.getByRole('button', { name: /Asignar/i });
    fireEvent.click(btnAsignar);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });

  it('debería agregar observaciones a una orden finalizada sin observaciones', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: 'Nueva obs' } as any);
    vi.mocked(ordenService.actualizarOrden).mockResolvedValue({ data: { success: true } } as any);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const btnObs = screen.getByRole('button', { name: /Agregar Observaciones/i });
    fireEvent.click(btnObs);

    await waitFor(() => {
      expect(ordenService.actualizarOrden).toHaveBeenCalledWith('ORD-3', expect.objectContaining({
        observaciones: 'Nueva obs'
      }));
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Guardado' }));
    });
  });

  it('debería manejar error al agregar observaciones', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: 'Nueva obs' } as any);
    vi.mocked(ordenService.actualizarOrden).mockRejectedValue(new Error('Falló obs'));
    renderComponent();
    await waitFor(() => expect(screen.getByText('Asignación de Técnicos')).toBeInTheDocument());

    const btnObs = screen.getByRole('button', { name: /Agregar Observaciones/i });
    fireEvent.click(btnObs);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudieron guardar las observaciones', 'error');
    });
  });
});
