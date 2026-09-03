import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../src/config/axios';
import {
  obtenerServicios,
  insertarServicio,
  actualizarServicio,
  eliminarServicio,
  habilitarServicio,
  ServicioPayload
} from '../../src/services/servicio.service';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('servicio.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPayload: ServicioPayload = {
    ID_SERVICIOS: '1',
    ID_CATEGORIA: 1,
    Nombre: 'Service',
    Precio: 100,
    Estado: 'Disponible'
  };

  it('should call get to /servicios', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerServicios();
    expect(apiClient.get).toHaveBeenCalledWith('/servicios');
  });

  it('should call post to /servicios', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await insertarServicio(mockPayload);
    expect(apiClient.post).toHaveBeenCalledWith('/servicios', expect.any(Object));
  });

  it('should call put to /servicios/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarServicio('1', mockPayload);
    expect(apiClient.put).toHaveBeenCalledWith('/servicios/1', expect.any(Object));
  });

  it('should call delete to /servicios/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarServicio('1');
    expect(apiClient.delete).toHaveBeenCalledWith('/servicios/eliminar/1');
  });

  it('should call put to /servicios/habilitar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await habilitarServicio('1');
    expect(apiClient.put).toHaveBeenCalledWith('/servicios/habilitar/1');
  });
});
