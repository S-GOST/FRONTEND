import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClienteHistorial from '../../src/componentes/TableCliente/ClienteHistorial';
import * as historialService from '../../src/services/historial.service';

vi.mock('../../src/services/historial.service');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('ClienteHistorial Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<MemoryRouter><ClienteHistorial /></MemoryRouter>);

  it('debería renderizar y cargar historial', async () => {
    const mockHistorial = [
      { id_historial: 1, fecha_registro: '2026-01-01T10:00:00Z', accion: 'Creación', tabla_afectada: 'orden_servicio', descripcion: 'Creado' }
    ];
    vi.mocked(historialService.obtenerMiHistorial).mockResolvedValue({ data: mockHistorial } as any);

    renderComponent();
    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Creación')).toBeInTheDocument();
      expect(screen.getByText('orden_servicio')).toBeInTheDocument();
      expect(screen.getByText('Creado')).toBeInTheDocument();
    });
  });

  it('debería mostrar estado vacío cuando no hay historial', async () => {
    vi.mocked(historialService.obtenerMiHistorial).mockResolvedValue({ data: [] } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Aún no tienes actividad registrada en el sistema.')).toBeInTheDocument();
    });
  });
});
