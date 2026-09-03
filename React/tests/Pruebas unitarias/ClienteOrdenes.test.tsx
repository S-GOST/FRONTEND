import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClienteOrdenes from '../../src/componentes/TableCliente/ClienteOrdenes';
import * as ordenService from '../../src/services/ordenServicioService';

vi.mock('../../src/services/ordenServicioService');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('ClienteOrdenes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<MemoryRouter><ClienteOrdenes /></MemoryRouter>);

  it('debería renderizar y cargar órdenes', async () => {
    const mockOrdenes = [
      { 
        ID_ORDEN_SERVICIO: 1, 
        Estado: 'Completado', 
        Fecha_inicio: '2026-01-01', 
        total: 5000,
        PlacaMoto: 'ABC123',
        detalles: []
      }
    ];
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);

    renderComponent();
    expect(screen.getByText('Cargando tus órdenes...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('#0001')).toBeInTheDocument();
      expect(screen.getByText('Completado')).toBeInTheDocument();
      expect(screen.getByText('$5.000')).toBeInTheDocument();
    });
  });

  it('debería expandir detalles al hacer clic en la orden', async () => {
    const mockOrdenes = [
      { 
        ID_ORDEN_SERVICIO: 1, 
        Estado: 'Pendiente', 
        Fecha_inicio: '2026-01-01', 
        total: 5000,
        PlacaMoto: 'ABC123',
        detalles: [
          { id_detalle: 1, ID_SERVICIOS: 2, NombreServicio: 'Aceite', cantidad: 1, precio_unitario: 5000, subtotal: 5000 }
        ]
      }
    ];
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('#0001')).toBeInTheDocument();
    });

    const ordenRow = screen.getByText('#0001').closest('div[role="button"]');
    if (ordenRow) {
      fireEvent.click(ordenRow);
    }

    await waitFor(() => {
      expect(screen.getByText('Detalle de la orden')).toBeInTheDocument();
      expect(screen.getByText('Aceite')).toBeInTheDocument();
    });
  });
});