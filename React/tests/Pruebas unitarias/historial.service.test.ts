import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerHistorial,
  eliminarHistorial,
  obtenerMiHistorial
} from '../../src/services/historial.service';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('historial.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /historial', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerHistorial();
    expect(apiClient.get).toHaveBeenCalledWith('/historial');
  });

  it('should call delete to /historial/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarHistorial(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/historial/eliminar/1');
  });

  it('should call get to /historial/mi-historial', async () => {
    const mockData = [{ id_historial: 1 }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
    const result = await obtenerMiHistorial();
    expect(apiClient.get).toHaveBeenCalledWith('/historial/mi-historial');
    expect(result).toEqual(mockData);
  });
});
