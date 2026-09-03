import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableHistorial from '../../src/componentes/Tablehistorial/historial';
import { obtenerHistorial } from '../../src/services/historial.service';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/services/historial.service', () => ({
  obtenerHistorial: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('TableHistorial', () => {
  const mockHistorial = [
    { id_historial: 1, id_usuario: 1, tabla_afectada: 'usuarios', id_registro: 1, accion: 'INSERT', descripcion: 'test desc', fecha_registro: '2023-01-01T12:00:00' },
    { id_historial: 2, id_usuario: 2, tabla_afectada: 'motos', id_registro: 2, accion: 'DELETE', descripcion: 'test del' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerHistorial).mockResolvedValue({ data: { success: true, data: mockHistorial } } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <TableHistorial />
    </MemoryRouter>
  );

  it('should render the list of records', async () => {
    renderComponent();
    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando historial...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('test desc')).toBeInTheDocument();
    expect(screen.getByText('test del')).toBeInTheDocument();
  });

  it('should filter by search term', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('test desc')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: 'motos' } });
    
    expect(screen.queryByText('test desc')).not.toBeInTheDocument();
    expect(screen.getByText('test del')).toBeInTheDocument();
  });

  it('should filter by action type', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('test desc')).toBeInTheDocument());
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'DELETE' } });
    
    expect(screen.queryByText('test desc')).not.toBeInTheDocument();
    expect(screen.getByText('test del')).toBeInTheDocument();
  });

  it('should reset filters', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('test desc')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: 'motos' } });
    
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);
    
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('test desc')).toBeInTheDocument();
  });
});
