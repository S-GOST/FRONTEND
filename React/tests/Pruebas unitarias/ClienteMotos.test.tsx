import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClienteMotos from '../../src/componentes/TableCliente/ClienteMotos';
import * as motoService from '../../src/services/moto.service';
import * as ordenService from '../../src/services/ordenServicioService';

vi.mock('../../src/services/moto.service');
vi.mock('../../src/services/ordenServicioService');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('ClienteMotos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_id', '123');
  });

  const renderComponent = () => render(<MemoryRouter><ClienteMotos /></MemoryRouter>);

  it('debería renderizar y cargar motos', async () => {
    const mockMotos = [{ ID_MOTOS: 1, id_cliente: '123', placa: 'ABC123', marca: 'KTM', modelo: 'Duke' }];
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: mockMotos } as any);
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: [] } as any);

    renderComponent();
    expect(screen.getByText('Cargando tus motocicletas...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('KTM')).toBeInTheDocument();
      expect(screen.getByText('Duke')).toBeInTheDocument();
    });
  });

  it('debería permitir registrar nueva moto', async () => {
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: [] } as any);
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: [] } as any);
    vi.mocked(motoService.insertarMoto).mockResolvedValue({ data: { success: true } } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Agregar/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar Moto/i })[0]);

    const inputPlaca = screen.getByLabelText(/Placa/i);
    const inputMarca = screen.getByLabelText(/Marca/i);
    const inputModelo = screen.getByLabelText(/Modelo/i);

    fireEvent.change(inputPlaca, { target: { value: 'XYZ789' } });
    fireEvent.change(inputMarca, { target: { value: 'KTM' } });
    fireEvent.change(inputModelo, { target: { value: '2022' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar Motocicleta/i }));

    await waitFor(() => {
      expect(motoService.insertarMoto).toHaveBeenCalledWith(expect.objectContaining({
        Placa: 'XYZ789',
        Marca: 'KTM',
        Modelo: '2022'
      }));
    });
  });
});
