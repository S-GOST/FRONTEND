import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerInformes,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  obtenerMisInformes,
  generarReporte,
  obtenerReporteProductividad,
  obtenerReporteInventario
} from '../../src/services/informe.service';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('informe.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /informes/obtener', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerInformes();
    expect(apiClient.get).toHaveBeenCalledWith('/informes/obtener');
  });

  it('should call post to /informes/insertar', async () => {
    const payload = { id_orden: 1, id_tecnico: 1 };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await crearInforme(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/informes/insertar', payload);
  });

  it('should call put to /informes/actualizar/:id', async () => {
    const payload = { diagnostico: 'test' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarInforme(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/informes/actualizar/1', payload);
  });

  it('should call delete to /informes/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarInforme(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/informes/eliminar/1');
  });

  it('should call get to /informes/mis-informes', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerMisInformes();
    expect(apiClient.get).toHaveBeenCalledWith('/informes/mis-informes');
  });

  it('should call post to /informes/generar-reporte', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await generarReporte('2023-01-01', '2023-01-31');
    expect(apiClient.post).toHaveBeenCalledWith('/informes/generar-reporte', { fecha_inicio: '2023-01-01', fecha_fin: '2023-01-31' });
  });

  it('should call get to /informes/productividad', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerReporteProductividad('2023-01-01', '2023-01-31');
    expect(apiClient.get).toHaveBeenCalledWith('/informes/productividad?fecha_inicio=2023-01-01&fecha_fin=2023-01-31');
  });

  it('should call get to /informes/inventario', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerReporteInventario('2023-01-01', '2023-01-31', 'Accesorios');
    expect(apiClient.get).toHaveBeenCalledWith('/informes/inventario?fecha_inicio=2023-01-01&fecha_fin=2023-01-31&categoria=Accesorios');
  });

  it('should call get to /informes/inventario with no params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerReporteInventario();
    expect(apiClient.get).toHaveBeenCalledWith('/informes/inventario?');
  });
});
