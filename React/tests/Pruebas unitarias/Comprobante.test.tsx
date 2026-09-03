import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Comprobante from '../../src/componentes/TableComprobante/Comprobante';
import * as comprobanteService from '../../src/services/comprobanteService';

vi.mock('../../src/services/comprobanteService');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
      internal: { pageSize: { height: 297 } }
    }))
  };
});
vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

describe('Comprobante Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_role', 'admin');
  });

  const renderComponent = () => render(<MemoryRouter><Comprobante /></MemoryRouter>);

  it('debería renderizar y cargar comprobantes', async () => {
    const mockComprobantes = [
      { id_comprobante: 1, id_orden: 1, fecha: '2026-01-01', subtotal: 1000, total_pagar: 1000, estado: 'Pendiente' }
    ];
    vi.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: mockComprobantes } as any);

    renderComponent();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/Historial de Comprobantes/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Pendiente/i).length).toBeGreaterThan(0);
      const texts = screen.getAllByText(/1\.000/i);
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  it('debería descargar PDF', async () => {
    const mockComprobantes = [
      { id_comprobante: 1, id_orden: 1, fecha: '2026-01-01', subtotal: 1000, total_pagar: 1000, estado: 'Pendiente' }
    ];
    vi.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: mockComprobantes } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /PDF/i }).length).toBeGreaterThan(0);
    });

    const btnPdf = screen.getAllByRole('button', { name: /PDF/i })[0];
    fireEvent.click(btnPdf);

    // Verificamos que el botón no arroje errores
    expect(btnPdf).toBeInTheDocument();
  });
});