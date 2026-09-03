import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  obtenerProductos,
  insertarProducto,
  actualizarProducto,
  eliminarProducto,
  habilitarProducto
} from '../../src/services/producto.service';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('producto.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call get to /productos', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await obtenerProductos();
    expect(apiClient.get).toHaveBeenCalledWith('/productos/obtener');
  });

  it('should normalize and call post to /productos/insertar', async () => {
    const payload = { ID_PRODUCTOS: '1', ID_CATEGORIA: '2', Marca: 'M', Nombre: 'N', precio_costo: '10' as any, precio_venta: '20' as any, stock: '5' as any, stock_minimo: '1' as any };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });
    await insertarProducto(payload);
    
    const callArg = vi.mocked(apiClient.post).mock.calls[0][1] as any;
    expect(apiClient.post).toHaveBeenCalledWith('/productos/insertar', expect.any(Object));
    expect(callArg.ID_CATEGORIA).toBe(2);
    expect(callArg.precio_costo).toBe(10);
    expect(callArg.precio_venta).toBe(20);
    expect(callArg.stock).toBe(5);
  });

  it('should normalize and call put to /productos/:id', async () => {
    const payload = { ID_PRODUCTOS: '1', ID_CATEGORIA: '2', Marca: 'M', Nombre: 'N', precio_costo: '10' as any, precio_venta: '20' as any, stock: '5' as any, stock_minimo: '1' as any };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await actualizarProducto('1', payload);
    
    expect(apiClient.put).toHaveBeenCalledWith('/productos/actualizar/1', expect.any(Object));
  });

  it('should call delete to /productos/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });
    await eliminarProducto('1');
    expect(apiClient.delete).toHaveBeenCalledWith('/productos/eliminar/1');
  });

  it('should call put to /productos/habilitar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: {} });
    await habilitarProducto('1');
    expect(apiClient.put).toHaveBeenCalledWith('/productos/habilitar/1');
  });
});
