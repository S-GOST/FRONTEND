import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerMotos,
  obtenerMotoPorId,
  insertarMoto,
  actualizarMoto,
  eliminarMoto
} from '../../src/services/moto.service';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('moto.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /motos', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerMotos();
    expect(apiClient.get).toHaveBeenCalledWith('/motos');
  });

  it('should call get to /motos/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: {} });
    await obtenerMotoPorId(1);
    expect(apiClient.get).toHaveBeenCalledWith('/motos/1');
  });

  it('should call post to /motos', async () => {
    const payload = { Placa: 'ABC-123' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await insertarMoto(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/motos', payload);
  });

  it('should call put to /motos/:id', async () => {
    const payload = { Placa: 'ABC-123' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarMoto(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/motos/1', payload);
  });

  it('should call delete to /motos/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarMoto(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/motos/eliminar/1');
  });
});
