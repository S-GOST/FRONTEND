import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClienteDashboard from '../../src/componentes/TableCliente/ClienteDashboard';
import * as motoService from '../../src/services/moto.service';
import * as ordenService from '../../src/services/ordenServicioService';

vi.mock('../../src/services/moto.service');
vi.mock('../../src/services/ordenServicioService');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('ClienteDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_id', '123');
    localStorage.setItem('user_name', 'Juan Cliente');
  });

  const renderComponent = () => render(
    <MemoryRouter initialEntries={['/cliente']}>
      <Routes>
        <Route path="/cliente" element={<ClienteDashboard />} />
      </Routes>
    </MemoryRouter>
  );

  it('debería renderizar bienvenida y cargar estadísticas', async () => {
    const mockMotos = [{ ID_MOTOS: 1, id_cliente: '123', placa: 'ABC123' }];
    const mockOrdenes = [{ ID_ORDEN_SERVICIO: 1, ID_CLIENTES: '123', Estado: 'Completado', Fecha_inicio: '2026-01-01' }];
    
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: mockMotos } as any);
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);

    renderComponent();
    expect(screen.getByText(/Bienvenido, Juan Cliente/i)).toBeInTheDocument();
    
    await waitFor(() => {
      // 1 orden completada
      expect(screen.getByText('Total Órdenes')).toBeInTheDocument();
      expect(screen.getByText('Completadas')).toBeInTheDocument();
      
      const statsValues = screen.getAllByText('1');
      expect(statsValues.length).toBeGreaterThan(0);
    });
  });
});
