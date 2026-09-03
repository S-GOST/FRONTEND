import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Usuarios from '../../src/componentes/TableAdmin/Usuarios';
import { obtenerAdmins, insertarAdmin, actualizarAdmin, eliminarAdmin, habilitarAdmin } from '../../src/services/admin.service';
import { obtenerTecnicos } from '../../src/services/tecnico.service';
import { obtenerClientes, obtenerClientesPendientes, procesarAprobacionCliente } from '../../src/services/cliente.service';
import { obtenerTiposDocumento } from '../../src/services/tipoDocumento.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/admin.service', () => ({
  obtenerAdmins: vi.fn(), insertarAdmin: vi.fn(), actualizarAdmin: vi.fn(), eliminarAdmin: vi.fn(), habilitarAdmin: vi.fn()
}));
vi.mock('../../src/services/tecnico.service', () => ({
  obtenerTecnicos: vi.fn(), insertarTecnico: vi.fn(), actualizarTecnico: vi.fn(), eliminarTecnico: vi.fn(), habilitarTecnico: vi.fn()
}));
vi.mock('../../src/services/cliente.service', () => ({
  obtenerClientes: vi.fn(), obtenerClientesPendientes: vi.fn(), insertarCliente: vi.fn(), actualizarCliente: vi.fn(), eliminarCliente: vi.fn(), habilitarCliente: vi.fn(), procesarAprobacionCliente: vi.fn()
}));
vi.mock('../../src/services/tipoDocumento.service', () => ({ obtenerTiposDocumento: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn(), showValidationMessage: vi.fn() } }));

describe('Usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerTiposDocumento).mockResolvedValue({ data: [{ id_tipo_documento: 1, nombre: 'CC' }] } as any);
    vi.mocked(obtenerAdmins).mockResolvedValue({ data: [
      { numero_documento: '1', nombre: 'Admin 1', correo: 'a@a.com', estado: 'Activo' }
    ] } as any);
    vi.mocked(obtenerTecnicos).mockResolvedValue({ data: [] } as any);
    vi.mocked(obtenerClientes).mockResolvedValue({ data: [] } as any);
    vi.mocked(obtenerClientesPendientes).mockResolvedValue({ data: [
      { numero_documento: '2', nombre: 'Pendiente 1', correo: 'p@p.com' }
    ] } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter initialEntries={['/admin/usuarios']}>
      <Usuarios />
    </MemoryRouter>
  );

  it('renders admins list', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin 1')).toBeInTheDocument();
    });
  });

  it('switches tabs and renders data', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());

    const pendBtn = screen.getByRole('button', { name: 'Pendientes' });
    fireEvent.click(pendBtn);

    await waitFor(() => {
      expect(screen.getByText('Pendiente 1')).toBeInTheDocument();
    });
  });

  it('handles search', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Buscar por/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    const searchBtn = screen.getByRole('button', { name: /Buscar/i });
    fireEvent.click(searchBtn);
    
    expect(screen.queryByText('Admin 1')).not.toBeInTheDocument();
    
    const resetBtn = screen.getByText(/Reset/i);
    fireEvent.click(resetBtn);
    
    expect(screen.getByText('Admin 1')).toBeInTheDocument();
  });

  it('opens create modal for admins', async () => {
    vi.mocked(insertarAdmin).mockResolvedValueOnce({ data: { success: true } } as any);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Nuevo Admin/i));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Crear Administrador/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Documento/i), { target: { value: '99' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText(/Correo/i), { target: { value: 'test@t.com' } });
    fireEvent.change(screen.getByLabelText(/Tipo de documento/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'pass' } });

    fireEvent.click(screen.getByText(/Guardar/i, { exact: true }));

    await waitFor(() => {
      expect(insertarAdmin).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Test Admin' }));
    });
  });

  it('disables admin', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarAdmin).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());

    const disableBtn = screen.getByTitle('Inhabilitar');
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(eliminarAdmin).toHaveBeenCalledWith('1');
    });
  });

  it('approves pending client', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(procesarAprobacionCliente).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));
    await waitFor(() => expect(screen.getByText('Pendiente 1')).toBeInTheDocument());

    const approveBtn = screen.getByRole('button', { name: /Aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(procesarAprobacionCliente).toHaveBeenCalledWith('2', 'Aprobar');
    });
  });
  
  it('rejects pending client', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: 'Razón' } as any);
    vi.mocked(procesarAprobacionCliente).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));
    await waitFor(() => expect(screen.getByText('Pendiente 1')).toBeInTheDocument());

    const rejectBtn = screen.getByRole('button', { name: /Rechazar/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(procesarAprobacionCliente).toHaveBeenCalledWith('2', 'Rechazar', 'Razón');
    });
  });
});
