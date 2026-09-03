import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerOrdenes,
  insertarOrden,
  actualizarOrden,
  eliminarOrden,
  obtenerMisOrdenes,
  obtenerDetallesPorOrden
} from '../../src/services/ordenServicioService';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('ordenServicioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /ordenes_servicio', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerOrdenes();
    expect(apiClient.get).toHaveBeenCalledWith('/ordenes_servicio');
  });

  it('should call post to /ordenes_servicio', async () => {
    const payload = { ID_CLIENTES: '1', ClienteNombre: 'Test', Estado: 'Pendiente', Fecha_inicio: '2023-01-01' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await insertarOrden(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/ordenes_servicio', payload);
  });

  it('should call put to /ordenes_servicio/:id', async () => {
    const payload = { Estado: 'Completado' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarOrden('1', payload);
    expect(apiClient.put).toHaveBeenCalledWith('/ordenes_servicio/1', payload);
  });

  it('should call delete to /ordenes_servicio/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarOrden('1');
    expect(apiClient.delete).toHaveBeenCalledWith('/ordenes_servicio/eliminar/1');
  });

  it('should call get to /ordenes_servicio/mis-ordenes', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerMisOrdenes();
    expect(apiClient.get).toHaveBeenCalledWith('/ordenes_servicio/mis-ordenes');
  });

  it('should call get to /detalles_orden_servicio/por_orden/:idOrden', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerDetallesPorOrden(1);
    expect(apiClient.get).toHaveBeenCalledWith('/detalles_orden_servicio/por_orden/1');
  });
});
