import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClienteComprobantes from '../../src/componentes/TableCliente/ClienteComprobantes';
import * as comprobanteService from '../../src/services/comprobanteService';

vi.mock('../../src/services/comprobanteService');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ value: 'Efectivo', isConfirmed: true }),
    showValidationMessage: vi.fn()
  }
}));

describe('ClienteComprobantes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<MemoryRouter><ClienteComprobantes /></MemoryRouter>);

  it('debería renderizar cargando y luego mostrar comprobantes', async () => {
    const mockComprobantes = [
      { id_comprobante: 1, id_orden: 1, fecha: '2026-01-01', total_pagar: 1000, estado: 'Pendiente' }
    ];
    vi.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({ data: mockComprobantes } as any);

    renderComponent();
    expect(screen.getByText('Cargando comprobantes...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Mis Comprobantes')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });
  });

  it('debería permitir pagar comprobante pendiente', async () => {
    const mockComprobantes = [
      { id_comprobante: 1, id_orden: 1, fecha: '2026-01-01', total_pagar: 1000, estado: 'Pendiente' }
    ];
    vi.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({ data: mockComprobantes } as any);
    vi.mocked(comprobanteService.pagarComprobante).mockResolvedValue({ success: true } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Pagar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pagar'));

    await waitFor(() => {
      expect(comprobanteService.pagarComprobante).toHaveBeenCalledWith(1, 'Efectivo');
    });
  });
});
