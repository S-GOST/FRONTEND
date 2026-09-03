import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerDetallesOrdenes,
  insertarDetalleOrden,
  actualizarDetalleOrden,
  eliminarDetalleOrden
} from '../../src/services/detalleOrdenServicioService';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('detalleOrdenServicioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /detalles_orden_servicio', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerDetallesOrdenes();
    expect(apiClient.get).toHaveBeenCalledWith('/detalles_orden_servicio');
  });

  it('should call post to /detalles_orden_servicio', async () => {
    const payload = { ID_ORDEN_SERVICIO: 1, Estado: 'Activo' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await insertarDetalleOrden(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/detalles_orden_servicio', payload);
  });

  it('should call put to /detalles_orden_servicio/:id', async () => {
    const payload = { ID_ORDEN_SERVICIO: 1, Estado: 'Activo' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarDetalleOrden(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/detalles_orden_servicio/1', payload);
  });

  it('should call delete to /detalles_orden_servicio/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarDetalleOrden(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/detalles_orden_servicio/eliminar/1');
  });
});
