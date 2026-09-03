import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TecnicoDashboard from '../../src/componentes/TableTecnico/TecnicoDashboard';
import { obtenerMisOrdenes, actualizarOrden, obtenerDetallesPorOrden } from '../../src/services/ordenServicioService';
import { obtenerClientes } from '../../src/services/cliente.service';
import { crearInforme, obtenerMisInformes } from '../../src/services/informe.service';
import { obtenerMotoPorId } from '../../src/services/moto.service';
import { clearSession } from '../../src/services/auth.services';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/ordenServicioService', () => ({
  obtenerMisOrdenes: vi.fn(),
  actualizarOrden: vi.fn(),
  obtenerDetallesPorOrden: vi.fn()
}));
vi.mock('../../src/services/cliente.service', () => ({ obtenerClientes: vi.fn() }));
vi.mock('../../src/services/informe.service', () => ({ crearInforme: vi.fn(), obtenerMisInformes: vi.fn() }));
vi.mock('../../src/services/moto.service', () => ({ obtenerMotoPorId: vi.fn() }));
vi.mock('../../src/services/auth.services', () => ({ clearSession: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('TecnicoDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_name', 'Test Tecnico');
    localStorage.setItem('user_id', '1');
    
    vi.mocked(obtenerMisOrdenes).mockResolvedValue({ data: [
      { ID_ORDEN_SERVICIO: '1', ID_CLIENTES: '1', Estado: 'Pendiente', Fecha_inicio: '2023-01-01', Fecha_estimada: '2023-01-05' }
    ] } as any);
    vi.mocked(obtenerClientes).mockResolvedValue({ data: [{ ID_CLIENTES: '1', Nombre: 'Cliente 1' }] } as any);
    vi.mocked(obtenerMisInformes).mockResolvedValue({ data: [] } as any);
    vi.mocked(obtenerDetallesPorOrden).mockResolvedValue({ data: [] } as any);
    vi.mocked(obtenerMotoPorId).mockResolvedValue({ data: {} } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <TecnicoDashboard />
    </MemoryRouter>
  );

  it('renders dashboard correctly', async () => {
    renderComponent();
    expect(screen.getByText('Cargando panel técnico...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando panel técnico...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Panel de Test Tecnico')).toBeInTheDocument();
    expect(screen.getByText('Cliente 1')).toBeInTheDocument();
  });

  it('allows logging out', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Panel de Test Tecnico')).toBeInTheDocument());

    const logoutBtn = screen.getByRole('button', { name: /Salir/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(clearSession).toHaveBeenCalled();
    });
  });

  it('opens details modal', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());

    const detailsBtn = screen.getByTitle('Ver detalles / Informe');
    fireEvent.click(detailsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Detalle — ORD-01/i)).toBeInTheDocument();
      expect(obtenerDetallesPorOrden).toHaveBeenCalledWith('1');
    });
  });

  it('updates order status', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(actualizarOrden).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());

    const updateBtn = screen.getByTitle('Pasar a En Proceso');
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(actualizarOrden).toHaveBeenCalledWith('1', expect.objectContaining({ Estado: 'En proceso' }));
    });
  });

  it('saves report and marks as completed', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(crearInforme).mockResolvedValueOnce({ data: { success: true } } as any);
    
    // Change order to 'En Proceso'
    vi.mocked(obtenerMisOrdenes).mockResolvedValue({ data: [
      { ID_ORDEN_SERVICIO: '1', ID_CLIENTES: '1', Estado: 'En Proceso', Fecha_inicio: '2023-01-01', Fecha_estimada: '2023-01-05' }
    ] } as any);

    renderComponent();
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());

    const btn = screen.getByRole('button', { name: /Redactar Informe/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Redactar Informe Técnico/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Diagnóstico/i), { target: { value: 'Diagnostico test' } });
    
    const saveBtn = screen.getByRole('button', { name: /Guardar Informe y Finalizar Orden/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(crearInforme).toHaveBeenCalledWith(expect.objectContaining({ diagnostico: 'Diagnostico test' }));
      expect(actualizarOrden).toHaveBeenCalledWith('1', expect.objectContaining({ Estado: 'Finalizada' }));
    });
  });
});
